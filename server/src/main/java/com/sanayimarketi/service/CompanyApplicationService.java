package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyApplication;
import com.sanayimarketi.entity.User;
import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import com.sanayimarketi.entity.enums.CompanyApplicationType;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyApplicationRepository;
import com.sanayimarketi.repository.CompanyRepository;
import com.sanayimarketi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyApplicationService {

    private final CompanyApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public CompanyApplication submitApplication(Long userId, CompanyApplicationType type,
                                                  Long targetCompanyId, String proposedName) {
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
                .status(CompanyApplicationStatus.PENDING)
                .build();

        return applicationRepository.save(application);
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
        return applicationRepository.save(application);
    }

    @Transactional
    public CompanyApplication rejectApplication(Long id) {
        CompanyApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyApplication", id));

        if (application.getStatus() != CompanyApplicationStatus.PENDING) {
            throw new IllegalStateException("Application is not in PENDING status");
        }

        application.setStatus(CompanyApplicationStatus.REJECTED);
        return applicationRepository.save(application);
    }
}
