package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyUser;
import com.sanayimarketi.entity.enums.CatalogFileType;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.exception.ResourceNotFoundException;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;

    @Value("${catalog.upload.dir}")
    private String catalogUploadDir;

    @Value("${logo.upload.dir}")
    private String logoUploadDir;

    public Page<Company> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable);
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
