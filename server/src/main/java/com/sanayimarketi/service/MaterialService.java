package com.sanayimarketi.service;

import com.sanayimarketi.dto.AdminMaterialResponseDTO;
import com.sanayimarketi.dto.AdminMaterialStatsDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyMaterial;
import com.sanayimarketi.entity.Material;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyMaterialRepository;
import com.sanayimarketi.repository.CompanyRepository;
import com.sanayimarketi.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final CompanyMaterialRepository companyMaterialRepository;
    private final CompanyRepository companyRepository;

    public Page<Material> getAllMaterials(Pageable pageable) {
        return materialRepository.findAll(pageable);
    }

    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
    }

    public List<Material> getRootMaterials() {
        return materialRepository.findByParentMaterialIsNull();
    }

    public List<Material> getChildMaterials(Long parentId) {
        return materialRepository.findByParentMaterialId(parentId);
    }

    public List<Material> searchMaterials(String name) {
        return materialRepository.findByMaterialNameContainingIgnoreCase(name.trim());
    }

    @Transactional
    public Material createMaterial(String materialName, Long parentMaterialId) {
        return createMaterial(materialName, parentMaterialId, null);
    }

    @Transactional
    public Material createMaterial(String materialName, Long parentMaterialId, Long createdByCompanyId) {
        Material material = Material.builder()
                .materialName(materialName.trim())
                .normalizedName(materialName.toLowerCase().trim())
                .createdByCompanyId(createdByCompanyId)
                .build();

        if (parentMaterialId != null) {
            Material parentMaterial = getMaterialById(parentMaterialId);
            material.setParentMaterial(parentMaterial);
        }

        return materialRepository.save(material);
    }

    @Transactional
    public Material updateMaterial(Long id, String materialName, Long parentMaterialId) {
        Material material = getMaterialById(id);
        material.setMaterialName(materialName.trim());
        material.setNormalizedName(materialName.toLowerCase().trim());

        if (parentMaterialId != null) {
            if (parentMaterialId.equals(id)) {
                throw new IllegalArgumentException("Material cannot be its own parent");
            }
            Material parentMaterial = getMaterialById(parentMaterialId);
            material.setParentMaterial(parentMaterial);
        } else {
            material.setParentMaterial(null);
        }

        return materialRepository.save(material);
    }

    @Transactional
    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        materialRepository.delete(material);
    }

    // ── Admin methods ──────────────────────────────────────────────

    public Page<AdminMaterialResponseDTO> getAdminMaterials(String filter, String search, Pageable pageable) {
        boolean hasSearch = search != null && !search.isBlank();
        String trimmedSearch = hasSearch ? search.trim() : null;

        Page<Material> page = switch (filter == null ? "ALL" : filter.toUpperCase()) {
            case "USER_CREATED" -> hasSearch
                    ? materialRepository.findByMaterialNameContainingIgnoreCaseAndCreatedByCompanyIdIsNotNull(trimmedSearch, pageable)
                    : materialRepository.findByCreatedByCompanyIdIsNotNull(pageable);
            case "UNUSED" -> hasSearch
                    ? materialRepository.findUnusedByName(trimmedSearch, pageable)
                    : materialRepository.findUnused(pageable);
            case "SUSPICIOUS" -> hasSearch
                    ? materialRepository.findSuspiciousByName(trimmedSearch, pageable)
                    : materialRepository.findSuspicious(pageable);
            default -> hasSearch
                    ? materialRepository.findByMaterialNameContainingIgnoreCase(trimmedSearch, pageable)
                    : materialRepository.findAll(pageable);
        };

        return enrichWithAdminData(page);
    }

    public AdminMaterialStatsDTO getAdminStats() {
        long total = materialRepository.count();
        long userCreated = materialRepository.countByCreatedByCompanyIdIsNotNull();
        long unused = materialRepository.countUnused();

        long suspicious = materialRepository.countSuspicious();

        return AdminMaterialStatsDTO.builder()
                .total(total)
                .userCreated(userCreated)
                .unused(unused)
                .suspicious(suspicious)
                .build();
    }

    @Transactional
    public void mergeMaterials(Long targetId, Long sourceId) {
        if (targetId.equals(sourceId)) {
            throw new IllegalArgumentException("Target and source must be different");
        }
        Material target = getMaterialById(targetId);
        getMaterialById(sourceId); // validate source exists

        List<CompanyMaterial> sourceLinks = companyMaterialRepository.findByMaterialId(sourceId);
        for (CompanyMaterial link : sourceLinks) {
            boolean alreadyHasTarget = companyMaterialRepository
                    .findByCompanyIdAndMaterialId(link.getCompany().getId(), targetId)
                    .isPresent();
            if (alreadyHasTarget) {
                companyMaterialRepository.delete(link);
            } else {
                link.setMaterial(target);
                companyMaterialRepository.save(link);
            }
        }

        materialRepository.deleteById(sourceId);
    }

    // ── Helpers ────────────────────────────────────────────────────

    private Page<AdminMaterialResponseDTO> enrichWithAdminData(Page<Material> page) {
        List<Long> ids = page.map(Material::getId).toList();

        Map<Long, Long> usageCounts = companyMaterialRepository.countByMaterialIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        List<Long> companyIds = page.stream()
                .map(Material::getCreatedByCompanyId)
                .filter(id -> id != null)
                .distinct()
                .toList();

        Map<Long, String> companyNames = companyRepository.findAllById(companyIds)
                .stream()
                .collect(Collectors.toMap(Company::getId, Company::getCompanyName));

        Set<String> duplicateNormalizedNames = new HashSet<>(materialRepository.findDuplicateNormalizedNames());

        return page.map(m -> {
            long usage = usageCounts.getOrDefault(m.getId(), 0L);
            boolean isDuplicate = m.getNormalizedName() != null
                    && duplicateNormalizedNames.contains(m.getNormalizedName());
            return toAdminDTO(m, usage, companyNames, isDuplicate);
        });
    }

    private AdminMaterialResponseDTO toAdminDTO(Material m, long usageCount,
                                                Map<Long, String> companyNames, boolean isDuplicate) {
        return AdminMaterialResponseDTO.builder()
                .id(m.getId())
                .materialName(m.getMaterialName())
                .normalizedName(m.getNormalizedName())
                .parentMaterialId(m.getParentMaterial() != null ? m.getParentMaterial().getId() : null)
                .parentMaterialName(m.getParentMaterial() != null ? m.getParentMaterial().getMaterialName() : null)
                .usageCount(usageCount)
                .createdAt(m.getCreatedAt())
                .createdByCompanyId(m.getCreatedByCompanyId())
                .createdByCompanyName(m.getCreatedByCompanyId() != null ? companyNames.get(m.getCreatedByCompanyId()) : null)
                .userCreated(m.getCreatedByCompanyId() != null)
                .suspicious(isSuspicious(m, usageCount, isDuplicate))
                .build();
    }

    private boolean isSuspicious(Material m, long usageCount, boolean isDuplicate) {
        boolean shortName = m.getMaterialName().trim().length() < 3;
        boolean orphan = m.getCreatedByCompanyId() != null && usageCount == 0;
        return shortName || orphan || isDuplicate;
    }
}
