package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyApplication;
import com.sanayimarketi.entity.CompanyUser;
import com.sanayimarketi.entity.User;
import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import com.sanayimarketi.entity.enums.CompanyApplicationType;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.entity.enums.UserRole;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyApplicationRepository;
import com.sanayimarketi.repository.CompanyRepository;
import com.sanayimarketi.repository.CompanyUserRepository;
import com.sanayimarketi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompanyApplicationService {

    private final CompanyApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;

    @Transactional
    public CompanyApplication submitApplication(Long userId, CompanyApplicationType type,
                                                  Long targetCompanyId, String proposedName,
                                                  String description, String phone,
                                                  String companyEmail, String website,
                                                  String city, String district, String fullAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Company targetCompany = null;
        if (targetCompanyId != null) {
            targetCompany = companyRepository.findById(targetCompanyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company", targetCompanyId));
        }

        CompanyApplication application = CompanyApplication.builder()
                .user(user)
                .applicationType(type)
                .targetCompany(targetCompany)
                .proposedCompanyName(proposedName)
                .description(description)
                .phone(phone)
                .companyEmail(companyEmail)
                .website(website)
                .city(city)
                .district(district)
                .fullAddress(fullAddress)
                .status(CompanyApplicationStatus.PENDING)
                .build();

        return applicationRepository.save(application);
    }

    public List<CompanyApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    public List<CompanyApplication> getPendingApplications() {
        return applicationRepository.findByStatusOrderByCreatedAtAsc(CompanyApplicationStatus.PENDING);
    }

    @Transactional
    public CompanyApplication approveApplication(Long id) {
        CompanyApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyApplication", id));

        if (application.getStatus() != CompanyApplicationStatus.PENDING) {
            throw new IllegalStateException("Application is not in PENDING status");
        }

        application.setStatus(CompanyApplicationStatus.APPROVED);
        // saveAndFlush ensures the DB trigger fires immediately (creates company+company_users for MANUAL_NEW).
        applicationRepository.saveAndFlush(application);

        CompanyApplicationType type = application.getApplicationType();
        User user = application.getUser();

        switch (type) {
            case AUTO_IMPORTED -> {
                // Company already exists as INACTIVE — just activate it. Do NOT touch admin's role.
                Company company = application.getTargetCompany();
                if (company != null) {
                    company.setStatus(CompanyStatus.ACTIVE);
                    companyRepository.save(company);
                }
            }
            case MANUAL_EXISTING -> {
                // Link user to the existing claimed company, then upgrade role.
                Company targetCompany = application.getTargetCompany();
                if (targetCompany == null) {
                    throw new IllegalStateException("MANUAL_EXISTING başvurusunda hedef firma bulunamadı");
                }
                companyUserRepository.findByUserId(user.getId()).ifPresentOrElse(
                    existing -> {
                        // User already linked to a company — must be the same target company (idempotent OK)
                        if (!existing.getCompany().getId().equals(targetCompany.getId())) {
                            throw new IllegalStateException(
                                "Kullanıcı zaten başka bir firmaya bağlı (firma ID: " + existing.getCompany().getId() + ")");
                        }
                        // Same company — idempotent, role upgrade is enough
                    },
                    () -> {
                        CompanyUser cu = CompanyUser.builder()
                                .user(user)
                                .company(targetCompany)
                                .build();
                        companyUserRepository.save(cu);
                    }
                );
                user.setRole(UserRole.COMPANY_USER);
                userRepository.save(user);
            }
            default -> {
                // MANUAL_NEW: DB trigger already created company + company_users row.
                // Upgrade role and copy additional fields from application.
                user.setRole(UserRole.COMPANY_USER);
                userRepository.save(user);
                companyUserRepository.findByUserId(user.getId()).ifPresent(cu -> {
                    Company company = cu.getCompany();
                    if (application.getDescription() != null) company.setDescription(application.getDescription());
                    if (application.getPhone() != null) company.setPhone(application.getPhone());
                    if (application.getCompanyEmail() != null) company.setEmail(application.getCompanyEmail());
                    if (application.getWebsite() != null) company.setWebsite(application.getWebsite());
                    if (application.getCity() != null) company.setCity(application.getCity());
                    if (application.getDistrict() != null) company.setDistrict(application.getDistrict());
                    if (application.getFullAddress() != null) company.setFullAddress(application.getFullAddress());
                    companyRepository.save(company);
                });
            }
        }

        return application;
    }

    @Transactional
    public CompanyApplication rejectApplication(Long id, String reason) {
        CompanyApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyApplication", id));

        if (application.getStatus() != CompanyApplicationStatus.PENDING) {
            throw new IllegalStateException("Application is not in PENDING status");
        }

        application.setStatus(CompanyApplicationStatus.REJECTED);
        application.setRejectionReason(reason);
        return applicationRepository.save(application);
    }

    @Transactional
    public CompanyApplication reapply(Long userId, String proposedName, String description,
                                       String phone, String companyEmail, String website,
                                       String city, String district, String fullAddress) {
        CompanyApplication last = applicationRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyApplication", userId));

        if (last.getStatus() != CompanyApplicationStatus.REJECTED) {
            throw new IllegalStateException("Reapplication is only allowed after a rejected application");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Preserve original application type and targetCompany (important for MANUAL_EXISTING reapplies)
        CompanyApplicationType type = last.getApplicationType() == CompanyApplicationType.AUTO_IMPORTED
                ? CompanyApplicationType.MANUAL_NEW  // AUTO_IMPORTED can't be re-applied by user
                : last.getApplicationType();

        CompanyApplication newApp = CompanyApplication.builder()
                .user(user)
                .applicationType(type)
                .targetCompany(type == CompanyApplicationType.MANUAL_EXISTING ? last.getTargetCompany() : null)
                .proposedCompanyName(proposedName)
                .description(description)
                .phone(phone)
                .companyEmail(companyEmail)
                .website(website)
                .city(city)
                .district(district)
                .fullAddress(fullAddress)
                .status(CompanyApplicationStatus.PENDING)
                .build();

        return applicationRepository.save(newApp);
    }

    public Optional<CompanyApplication> getLatestApplicationByUserId(Long userId) {
        return applicationRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }
}
