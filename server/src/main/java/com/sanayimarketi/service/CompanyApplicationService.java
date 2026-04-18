package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyApplication;
import com.sanayimarketi.entity.User;
import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import com.sanayimarketi.entity.enums.CompanyApplicationType;
import com.sanayimarketi.entity.enums.UserRole;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyApplicationRepository;
import com.sanayimarketi.repository.CompanyRepository;
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
        applicationRepository.save(application);

        // Upgrade user role from PENDING_COMPANY_USER to COMPANY_USER
        User user = application.getUser();
        user.setRole(UserRole.COMPANY_USER);
        userRepository.save(user);

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

        CompanyApplication newApp = CompanyApplication.builder()
                .user(user)
                .applicationType(CompanyApplicationType.MANUAL_NEW)
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
