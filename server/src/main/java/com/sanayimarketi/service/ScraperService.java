package com.sanayimarketi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sanayimarketi.dto.*;
import com.sanayimarketi.entity.*;
import com.sanayimarketi.entity.enums.*;
import com.sanayimarketi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScraperService {

    private final CompanyRepository companyRepository;
    private final CompanyApplicationRepository companyApplicationRepository;
    private final UserRepository userRepository;
    private final MaterialRepository materialRepository;
    private final CompanyMaterialRepository companyMaterialRepository;
    private final ObjectMapper objectMapper;

    @Value("${scraper.output-dir}")
    private String scraperOutputDir;

    @Value("${scraper.script-dir}")
    private String scraperScriptDir;

    @Value("${catalog.upload.dir}")
    private String catalogUploadDir;

    // ── Run scraper ──────────────────────────────────────────────────

    public ScraperResultDTO runScraper(String companyName, String website, List<String> sectors) {
        Path tempFile = null;
        try {
            // Input JSON'u geçici dosyaya yaz (charset sorunlarını önler)
            tempFile = Files.createTempFile("scraper_input_", ".json");
            Map<String, Object> input = new HashMap<>();
            input.put("company_name", companyName);
            input.put("website", website);
            input.put("sector", sectors != null ? String.join("/", sectors) : "");
            objectMapper.writeValue(tempFile.toFile(), input);

            ProcessBuilder pb = new ProcessBuilder("python", "main.py", "--input-json", tempFile.toString());
            pb.directory(new File(scraperScriptDir));
            pb.redirectErrorStream(true);
            pb.environment().put("PYTHONIOENCODING", "utf-8");

            Process process = pb.start();
            StringBuilder processOutput = new StringBuilder();
            Thread stdoutReader = new Thread(() -> {
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        processOutput.append(line).append('\n');
                    }
                } catch (IOException ignored) {}
            });
            stdoutReader.start();

            boolean finished = process.waitFor(600, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                try { stdoutReader.join(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                log.warn("Scraper zaman aşımı [{}]:\n{}", companyName, processOutput.toString().trim());
                return errorResult(companyName, website, sectors, "Scraper zaman aşımına uğradı (10 dk)");
            }
            try { stdoutReader.join(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            log.debug("Scraper çıktısı [{}]:\n{}", companyName, processOutput.toString().trim());

            // Sonuç JSON'unu oku
            String safeName = sanitizeFilename(companyName);
            Path jsonPath = Paths.get(scraperOutputDir, "catalogs", safeName, "company_info.json");

            if (!Files.exists(jsonPath)) {
                log.warn("Scraper çıktı dosyası bulunamadı: {}\nProcess çıktısı:\n{}", jsonPath, processOutput.toString().trim());
                return errorResult(companyName, website, sectors,
                        "Sonuç dosyası bulunamadı. Scraper çalışmamış veya hata oluşmuş olabilir.");
            }
            return parseCompanyJson(jsonPath);

        } catch (Exception e) {
            return errorResult(companyName, website, sectors, e.getMessage());
        } finally {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
        }
    }

    // ── Get all results ──────────────────────────────────────────────

    public List<ScraperResultDTO> getScraperResults() {
        List<ScraperResultDTO> results = new ArrayList<>();
        Path catalogsPath = Paths.get(scraperOutputDir, "catalogs");

        if (!Files.exists(catalogsPath)) return results;

        try (Stream<Path> dirs = Files.list(catalogsPath)) {
            dirs.filter(Files::isDirectory).forEach(dir -> {
                Path jsonFile = dir.resolve("company_info.json");
                if (Files.exists(jsonFile)) {
                    try {
                        results.add(parseCompanyJson(jsonFile));
                    } catch (Exception e) {
                        log.warn("company_info.json parse hatası [{}]: {}", jsonFile, e.getMessage());
                    }
                }
            });
        } catch (IOException ignored) {}

        results.sort(Comparator.comparing(
                r -> r.getScrapeDate() == null ? "" : r.getScrapeDate(),
                Comparator.reverseOrder()));
        return results;
    }

    // ── Import company ───────────────────────────────────────────────

    @Transactional
    public ScraperImportResultDTO importCompany(ScraperImportRequestDTO request) {
        // 1. Company kaydı oluştur (INACTIVE)
        Company company = Company.builder()
                .companyName(request.getCompanyName())
                .website(request.getWebsite())
                .description(request.getDescription())
                .phone(request.getPhone())
                .email(request.getEmail())
                .city(request.getCity())
                .district(request.getDistrict())
                .fullAddress(request.getAddress())
                .logoUrl(request.getLogoUrl())
                .status(CompanyStatus.INACTIVE)
                .build();
        company = companyRepository.save(company);

        // 2. Katalog dosyasını kopyala
        if (request.getCatalogFile() != null && !request.getCatalogFile().isBlank()) {
            String safeName = sanitizeFilename(request.getCompanyName());
            Path sourcePath = Paths.get(scraperOutputDir, "catalogs", safeName, request.getCatalogFile());
            if (Files.exists(sourcePath)) {
                try {
                    Path destDir = Paths.get(catalogUploadDir, String.valueOf(company.getId()));
                    Files.createDirectories(destDir);
                    String destFilename = UUID.randomUUID() + "_"
                            + request.getCatalogFile().replaceAll("[^a-zA-Z0-9._-]", "_");
                    Files.copy(sourcePath, destDir.resolve(destFilename));

                    String lower = request.getCatalogFile().toLowerCase();
                    CatalogFileType fileType = lower.endsWith(".pdf") ? CatalogFileType.PDF
                            : lower.endsWith(".docx") ? CatalogFileType.DOCX : CatalogFileType.DOC;

                    company.setCatalogFileUrl("/uploads/catalogs/" + company.getId() + "/" + destFilename);
                    company.setCatalogFileType(fileType);
                    company = companyRepository.save(company);
                } catch (IOException e) {
                    // Katalog kopyalanamadı — firma kaydına devam et
                }
            }
        }

        // 3. CompanyApplication oluştur (AUTO_IMPORTED)
        User adminUser = userRepository.findByEmail("admin@sanayimarketi.com")
                .orElseGet(() -> userRepository.findFirstByRole(UserRole.ADMIN)
                        .orElseThrow(() -> new RuntimeException("Admin kullanıcı bulunamadı")));

        CompanyApplication application = CompanyApplication.builder()
                .user(adminUser)
                .proposedCompanyName(request.getCompanyName())
                .applicationType(CompanyApplicationType.AUTO_IMPORTED)
                .status(CompanyApplicationStatus.PENDING)
                .description(request.getDescription())
                .phone(request.getPhone())
                .companyEmail(request.getEmail())
                .website(request.getWebsite())
                .city(request.getCity())
                .district(request.getDistrict())
                .fullAddress(request.getAddress())
                .targetCompany(company)
                .build();
        application = companyApplicationRepository.save(application);

        // 4. company_info.json'da imported: true ve company_id yaz
        String safeName = sanitizeFilename(request.getCompanyName());
        Path jsonPath = Paths.get(scraperOutputDir, "catalogs", safeName, "company_info.json");
        setImportedFlag(jsonPath, true);
        setCompanyIdFlag(jsonPath, company.getId());

        return new ScraperImportResultDTO(company.getId(), application.getId());
    }

    // ── Import materials ─────────────────────────────────────────────

    @Transactional
    public MaterialImportResultDTO importMaterials(List<MaterialImportItemDTO> items) {
        int created = 0;
        List<String> duplicates = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (MaterialImportItemDTO item : items) {
            if (item.getMaterialName() == null || item.getMaterialName().isBlank()) continue;
            String name = item.getMaterialName().trim();

            try {
                Material material;
                if (materialRepository.existsByMaterialNameIgnoreCase(name)) {
                    duplicates.add(name);
                    // Material already exists — still create company link if requested
                    material = materialRepository.findByMaterialNameIgnoreCase(name).orElse(null);
                    if (material == null) continue;
                } else {
                    material = new Material();
                    material.setMaterialName(name);
                    material.setNormalizedName(name.toLowerCase().trim());
                    material.setCreatedByCompanyId(item.getCompanyId());
                    material = materialRepository.save(material);
                    created++;
                }

                // company_materials bağlantısı oluştur (companyId verilmişse)
                if (item.getCompanyId() != null) {
                    Long companyId = item.getCompanyId();
                    Long materialId = material.getId();
                    final Material savedMaterial = material; // lambda için effectively final referans
                    if (!companyRepository.existsById(companyId)) {
                        log.warn("importMaterials: companyId={} bulunamadı, malzeme '{}' bağlantısız eklendi", companyId, name);
                    } else if (companyMaterialRepository.findByCompanyIdAndMaterialId(companyId, materialId).isEmpty()) {
                        companyRepository.findById(companyId).ifPresent(company -> {
                            CompanyMaterial cm = new CompanyMaterial();
                            cm.setCompany(company);
                            cm.setMaterial(savedMaterial);
                            cm.setRole(CompanyMaterialRole.PRODUCER);
                            cm.setPrice(null);
                            cm.setUnit(null);
                            companyMaterialRepository.save(cm);
                        });
                    }
                }
            } catch (Exception e) {
                errors.add(name + ": " + e.getMessage());
            }
        }
        return new MaterialImportResultDTO(created, duplicates, errors);
    }

    // ── Catalog analysis ─────────────────────────────────────────────

    public MaterialsCandidatesResponseDTO analyzeCatalog(String companyName, Integer testDir) {
        String safeName = sanitizeFilename(companyName);
        Path companyDir = testDir != null
                ? Paths.get(scraperOutputDir, "tests", "test-" + testDir, safeName)
                : Paths.get(scraperOutputDir, "catalogs", safeName);

        if (!Files.exists(companyDir)) {
            throw new IllegalArgumentException("Firma dizini bulunamadı: " + companyDir);
        }

        try {
            List<String> cmd = new ArrayList<>(List.of(
                    "python", "catalog_analyzer.py", "--company", companyName));
            if (testDir != null) {
                cmd.add("--test-dir");
                cmd.add(String.valueOf(testDir));
            }

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(new File(scraperScriptDir));
            pb.redirectErrorStream(true);
            pb.environment().put("PYTHONIOENCODING", "utf-8");

            Process process = pb.start();
            Thread reader = new Thread(() -> {
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(process.getInputStream(),
                                java.nio.charset.StandardCharsets.UTF_8))) {
                    while (br.readLine() != null) {}
                } catch (IOException ignored) {}
            });
            reader.start();
            boolean finished = process.waitFor(120, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("Katalog analizi zaman aşımı [{}]", companyName);
                throw new RuntimeException("Katalog analizi zaman aşımına uğradı");
            }
            try { reader.join(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

        } catch (Exception e) {
            if (e instanceof RuntimeException re) throw re;
            throw new RuntimeException("Katalog analizi çalıştırılamadı: " + e.getMessage(), e);
        }

        return getCatalogCandidates(companyName, testDir);
    }

    public MaterialsCandidatesResponseDTO getCatalogCandidates(String companyName, Integer testDir) {
        String safeName = sanitizeFilename(companyName);
        Path candidatesPath = testDir != null
                ? Paths.get(scraperOutputDir, "tests", "test-" + testDir, safeName, "materials_candidates.json")
                : Paths.get(scraperOutputDir, "catalogs", safeName, "materials_candidates.json");

        if (!Files.exists(candidatesPath)) {
            return MaterialsCandidatesResponseDTO.builder()
                    .companyName(companyName)
                    .status("NOT_ANALYZED")
                    .candidates(List.of())
                    .totalCandidates(0)
                    .build();
        }

        try {
            JsonNode root = objectMapper.readTree(candidatesPath.toFile());
            List<MaterialCandidateDTO> candidates = new ArrayList<>();
            root.path("candidates").forEach(node -> candidates.add(MaterialCandidateDTO.builder()
                    .name(node.path("name").asText())
                    .confidence(node.path("confidence").asDouble())
                    .sourcePage(node.path("source_page").asInt())
                    .category(nullIfEmpty(node.path("category").asText(null)))
                    .build()));

            return MaterialsCandidatesResponseDTO.builder()
                    .companyName(root.path("company_name").asText(companyName))
                    .catalogFile(nullIfEmpty(root.path("catalog_file").asText(null)))
                    .analyzedAt(nullIfEmpty(root.path("analyzed_at").asText(null)))
                    .extractionMethod(root.path("extraction_method").asText("rule-based"))
                    .candidates(candidates)
                    .totalCandidates(root.path("total_candidates").asInt(candidates.size()))
                    .status(root.path("status").asText("PENDING_REVIEW"))
                    .build();
        } catch (IOException e) {
            log.warn("materials_candidates.json parse hatası [{}]: {}", companyName, e.getMessage());
            throw new RuntimeException("Katalog sonuçları okunamadı", e);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private ScraperResultDTO parseCompanyJson(Path jsonPath) throws IOException {
        JsonNode root = objectMapper.readTree(jsonPath.toFile());
        JsonNode contactInfo = root.path("contact_info");
        JsonNode catalogInfo = root.path("catalog_info");

        List<String> sectors = new ArrayList<>();
        root.path("sectors").forEach(s -> sectors.add(s.asText()));

        List<String> catalogFiles = new ArrayList<>();
        catalogInfo.path("files").forEach(f -> catalogFiles.add(f.asText()));

        return ScraperResultDTO.builder()
                .companyName(nullIfEmpty(root.path("company_name").asText(null)))
                .website(nullIfEmpty(root.path("website").asText(null)))
                .sectors(sectors)
                .status(root.path("status").asText("ERROR"))
                .phone(nullIfEmpty(contactInfo.path("phone").asText(null)))
                .email(nullIfEmpty(contactInfo.path("email").asText(null)))
                .address(nullIfEmpty(contactInfo.path("address").asText(null)))
                .city(nullIfEmpty(contactInfo.path("city").asText(null)))
                .district(nullIfEmpty(contactInfo.path("district").asText(null)))
                .logoUrl(nullIfEmpty(root.path("logo_url").asText(null)))
                .description(nullIfEmpty(root.path("description").asText(null)))
                .catalogCount(catalogInfo.path("count").asInt(0))
                .catalogFiles(catalogFiles)
                .imported(root.path("imported").asBoolean(false))
                .companyId(root.has("company_id") && !root.path("company_id").isNull()
                        ? root.path("company_id").asLong() : null)
                .scrapeDate(root.path("scrape_date").asText(null))
                .build();
    }

    private void setCompanyIdFlag(Path jsonPath, Long companyId) {
        try {
            if (!Files.exists(jsonPath)) return;
            JsonNode root = objectMapper.readTree(jsonPath.toFile());
            ((ObjectNode) root).put("company_id", companyId);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(jsonPath.toFile(), root);
        } catch (IOException e) {
            log.warn("company_id bayrağı güncellenemedi [{}]: {}", jsonPath, e.getMessage());
        }
    }

    private void setImportedFlag(Path jsonPath, boolean value) {
        try {
            if (!Files.exists(jsonPath)) return;
            JsonNode root = objectMapper.readTree(jsonPath.toFile());
            ((ObjectNode) root).put("imported", value);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(jsonPath.toFile(), root);
        } catch (IOException e) {
            log.warn("imported bayrağı güncellenemedi [{}]: {}", jsonPath, e.getMessage());
        }
    }

    /** Python sanitize_filename() ile birebir aynı davranış */
    String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) return "unnamed_file";
        String s = name.replaceAll("[<>:\"/\\\\|?*]", "_")
                       .replace(' ', '_')
                       .replaceAll("_+", "_")
                       .replaceAll("^_+|_+$", "");
        return s.isEmpty() ? "unnamed_file" : s;
    }

    private String nullIfEmpty(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private ScraperResultDTO errorResult(String name, String website, List<String> sectors, String msg) {
        return ScraperResultDTO.builder()
                .companyName(name).website(website).sectors(sectors)
                .status("ERROR").errorMessage(msg).build();
    }
}
