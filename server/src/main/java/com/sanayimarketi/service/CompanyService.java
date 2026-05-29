package com.sanayimarketi.service;

import com.sanayimarketi.dto.CompanyUpdateRequestDTO;
import com.sanayimarketi.dto.DuplicatePairDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyUser;
import com.sanayimarketi.entity.enums.CatalogFileType;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.repository.CompanyRepository;
import com.sanayimarketi.repository.CompanyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final CompanyMapper companyMapper;

    @Value("${catalog.upload.dir}")
    private String catalogUploadDir;

    @Value("${logo.upload.dir}")
    private String logoUploadDir;

    public Page<Company> getAllCompanies(String name, String city, Pageable pageable) {
        boolean hasName = name != null && !name.isBlank();
        boolean hasCity = city != null && !city.isBlank();
        if (hasName && hasCity) return companyRepository.findByNameAndCityAndStatus(name.trim(), city.trim(), CompanyStatus.ACTIVE, pageable);
        if (hasName) return companyRepository.findAllByStatusAndCompanyNameContainingIgnoreCase(CompanyStatus.ACTIVE, name.trim(), pageable);
        if (hasCity) return companyRepository.findAllByStatusAndCityIgnoreCase(CompanyStatus.ACTIVE, city.trim(), pageable);
        return companyRepository.findAllByStatus(CompanyStatus.ACTIVE, pageable);
    }

    public List<Company> getCompaniesByStatus(CompanyStatus status) {
        return companyRepository.findByStatus(status);
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
    }

    @Transactional
    public Company updateCompany(Long id, Company companyDetails, Long requestingUserId) {
        Company company = getCompanyById(id);

        CompanyUser companyUser = companyUserRepository.findByUserId(requestingUserId)
                .orElseThrow(() -> new SecurityException("User is not linked to any company"));
        if (!companyUser.getCompany().getId().equals(id)) {
            throw new SecurityException("User is not authorized to update this company");
        }

        company.setCompanyName(companyDetails.getCompanyName());
        company.setDescription(companyDetails.getDescription());
        company.setCountry(companyDetails.getCountry());
        company.setCity(companyDetails.getCity());
        company.setDistrict(companyDetails.getDistrict());
        company.setFullAddress(companyDetails.getFullAddress());
        company.setPhone(companyDetails.getPhone());
        company.setEmail(companyDetails.getEmail());
        company.setWebsite(companyDetails.getWebsite());
        company.setLatitude(companyDetails.getLatitude());
        company.setLongitude(companyDetails.getLongitude());
        company.setGoogleMapsEmbedUrl(companyDetails.getGoogleMapsEmbedUrl());
        // status, logoUrl, catalogFileUrl/Type are managed by dedicated endpoints — do not overwrite here

        return companyRepository.save(company);
    }

    /** Admin: firma güncelle — sahiplik kontrolü yok */
    @Transactional
    public Company adminUpdateCompany(Long id, CompanyUpdateRequestDTO request) {
        Company company = getCompanyById(id);
        if (request.getCompanyName() != null) company.setCompanyName(request.getCompanyName());
        if (request.getDescription() != null) company.setDescription(request.getDescription());
        if (request.getCountry() != null) company.setCountry(request.getCountry());
        if (request.getCity() != null) company.setCity(request.getCity());
        if (request.getDistrict() != null) company.setDistrict(request.getDistrict());
        if (request.getFullAddress() != null) company.setFullAddress(request.getFullAddress());
        if (request.getPhone() != null) company.setPhone(request.getPhone());
        if (request.getEmail() != null) company.setEmail(request.getEmail());
        if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
        if (request.getLatitude() != null) company.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) company.setLongitude(request.getLongitude());
        if (request.getGoogleMapsEmbedUrl() != null) company.setGoogleMapsEmbedUrl(request.getGoogleMapsEmbedUrl());
        return companyRepository.save(company);
    }

    public List<Company> searchCompaniesByName(String name) {
        return companyRepository.findByCompanyNameContainingIgnoreCase(name);
    }

    @Transactional
    public Company uploadCatalog(Long companyId, MultipartFile file, Long requestingUserId) {
        Company company = getCompanyById(companyId);

        CompanyUser companyUser = companyUserRepository.findByUserId(requestingUserId)
                .orElseThrow(() -> new SecurityException("User is not linked to any company"));
        if (!companyUser.getCompany().getId().equals(companyId)) {
            throw new SecurityException("User is not authorized to update this company");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        CatalogFileType fileType = switch (ext) {
            case "pdf"  -> CatalogFileType.PDF;
            case "doc"  -> CatalogFileType.DOC;
            case "docx" -> CatalogFileType.DOCX;
            default -> throw new IllegalArgumentException("Unsupported file type: " + ext);
        };

        try {
            Path dir = Paths.get(catalogUploadDir, String.valueOf(companyId));
            Files.createDirectories(dir);

            // Delete old catalog file if it exists
            if (company.getCatalogFileUrl() != null) {
                String oldFilename = company.getCatalogFileUrl()
                        .substring(company.getCatalogFileUrl().lastIndexOf('/') + 1);
                Files.deleteIfExists(dir.resolve(oldFilename));
            }

            String filename = UUID.randomUUID() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            Files.copy(file.getInputStream(), dir.resolve(filename));

            company.setCatalogFileUrl("/uploads/catalogs/" + companyId + "/" + filename);
            company.setCatalogFileType(fileType);
            return companyRepository.save(company);

        } catch (IOException e) {
            throw new RuntimeException("Failed to save catalog file", e);
        }
    }

    @Transactional
    public Company deleteCatalog(Long companyId, Long requestingUserId) {
        Company company = getCompanyById(companyId);

        CompanyUser companyUser = companyUserRepository.findByUserId(requestingUserId)
                .orElseThrow(() -> new SecurityException("User is not linked to any company"));
        if (!companyUser.getCompany().getId().equals(companyId)) {
            throw new SecurityException("User is not authorized to update this company");
        }

        if (company.getCatalogFileUrl() != null) {
            try {
                String filename = company.getCatalogFileUrl()
                        .substring(company.getCatalogFileUrl().lastIndexOf('/') + 1);
                Path file = Paths.get(catalogUploadDir, String.valueOf(companyId), filename);
                Files.deleteIfExists(file);
            } catch (IOException ignored) {
            }
            company.setCatalogFileUrl(null);
            company.setCatalogFileType(null);
            return companyRepository.save(company);
        }
        return company;
    }

    @Transactional
    public Company changeStatus(Long companyId, CompanyStatus newStatus) {
        Company company = getCompanyById(companyId);
        company.setStatus(newStatus);
        return companyRepository.save(company);
    }

    private static final java.util.Set<String> ALLOWED_IMAGE_TYPES = java.util.Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    @Transactional
    public Company uploadLogo(Long companyId, MultipartFile file, Long requestingUserId) {
        Company company = getCompanyById(companyId);

        CompanyUser companyUser = companyUserRepository.findByUserId(requestingUserId)
                .orElseThrow(() -> new SecurityException("User is not linked to any company"));
        if (!companyUser.getCompany().getId().equals(companyId)) {
            throw new SecurityException("User is not authorized to update this company");
        }

        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Unsupported image type. Allowed: JPEG, PNG, WebP, GIF");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Logo file must not exceed 5 MB");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "logo";
        String ext = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".jpg";

        try {
            Path dir = Paths.get(logoUploadDir, String.valueOf(companyId));
            Files.createDirectories(dir);

            if (company.getLogoUrl() != null) {
                String oldFilename = company.getLogoUrl()
                        .substring(company.getLogoUrl().lastIndexOf('/') + 1);
                Files.deleteIfExists(dir.resolve(oldFilename));
            }

            String filename = UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), dir.resolve(filename));

            company.setLogoUrl("/uploads/logos/" + companyId + "/" + filename);
            return companyRepository.save(company);

        } catch (IOException e) {
            throw new RuntimeException("Failed to save logo file", e);
        }
    }

    @Transactional
    public Company deleteLogo(Long companyId, Long requestingUserId) {
        Company company = getCompanyById(companyId);

        CompanyUser companyUser = companyUserRepository.findByUserId(requestingUserId)
                .orElseThrow(() -> new SecurityException("User is not linked to any company"));
        if (!companyUser.getCompany().getId().equals(companyId)) {
            throw new SecurityException("User is not authorized to update this company");
        }

        if (company.getLogoUrl() != null) {
            try {
                String filename = company.getLogoUrl()
                        .substring(company.getLogoUrl().lastIndexOf('/') + 1);
                Files.deleteIfExists(Paths.get(logoUploadDir, String.valueOf(companyId), filename));
            } catch (IOException ignored) {
            }
            company.setLogoUrl(null);
            return companyRepository.save(company);
        }
        return company;
    }

    public List<DuplicatePairDTO> findDuplicatePairs() {
        List<Company> companies = companyRepository.findByStatusNot(CompanyStatus.MERGED);
        List<DuplicatePairDTO> pairs = new ArrayList<>();
        for (int i = 0; i < companies.size(); i++) {
            for (int j = i + 1; j < companies.size(); j++) {
                Company a = companies.get(i);
                Company b = companies.get(j);
                int similarity = nameSimilarityPercent(a.getCompanyName(), b.getCompanyName());
                if (similarity >= 70) {
                    pairs.add(new DuplicatePairDTO(
                            companyMapper.toResponseDTO(a),
                            companyMapper.toResponseDTO(b),
                            similarity));
                }
            }
        }
        pairs.sort(Comparator.comparingInt(DuplicatePairDTO::getSimilarityPercent).reversed());
        return pairs;
    }

    private static int nameSimilarityPercent(String a, String b) {
        String na = normalizeName(a);
        String nb = normalizeName(b);
        if (na.isEmpty() || nb.isEmpty()) return 0;
        int dist = levenshtein(na, nb);
        int maxLen = Math.max(na.length(), nb.length());
        return (int) Math.round(100.0 * (1.0 - (double) dist / maxLen));
    }

    private static String normalizeName(String name) {
        return name.toLowerCase()
                .replace("ı", "i").replace("ş", "s").replace("ğ", "g")
                .replace("ü", "u").replace("ö", "o").replace("ç", "c")
                .replaceAll("\\ba\\.ş\\.\\b|\\bltd\\.\\b|\\bltd\\b|\\bşti\\.\\b|\\bsanayi\\b"
                        + "|\\bsan\\.\\b|\\btic\\.\\b|\\bticaret\\b|\\bve\\b|\\bco\\.\\b|\\binc\\.\\b", "")
                .replaceAll("[^a-z0-9 ]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static int levenshtein(String a, String b) {
        int m = a.length(), n = b.length();
        int[] prev = new int[n + 1], curr = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            curr[0] = i;
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) curr[j] = prev[j - 1];
                else curr[j] = 1 + Math.min(prev[j - 1], Math.min(prev[j], curr[j - 1]));
            }
            int[] tmp = prev; prev = curr; curr = tmp;
        }
        return prev[n];
    }

    @Transactional
    public void mergeCompanies(Long primaryId, Long secondaryId) {
        Company primary = getCompanyById(primaryId);
        Company secondary = getCompanyById(secondaryId);

        // Fill primary's blank fields from secondary
        if (primary.getDescription() == null && secondary.getDescription() != null)
            primary.setDescription(secondary.getDescription());
        if (primary.getPhone() == null && secondary.getPhone() != null)
            primary.setPhone(secondary.getPhone());
        if (primary.getEmail() == null && secondary.getEmail() != null)
            primary.setEmail(secondary.getEmail());
        if (primary.getWebsite() == null && secondary.getWebsite() != null)
            primary.setWebsite(secondary.getWebsite());
        if (primary.getCatalogFileUrl() == null && secondary.getCatalogFileUrl() != null) {
            primary.setCatalogFileUrl(secondary.getCatalogFileUrl());
            primary.setCatalogFileType(secondary.getCatalogFileType());
        }

        secondary.setStatus(CompanyStatus.MERGED);
        companyRepository.save(primary);
        companyRepository.save(secondary);
    }
}
