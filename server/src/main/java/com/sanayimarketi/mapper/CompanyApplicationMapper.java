package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.CompanyApplicationResponseDTO;
import com.sanayimarketi.entity.CompanyApplication;
import org.springframework.stereotype.Component;

@Component
public class CompanyApplicationMapper {

    public CompanyApplicationResponseDTO toResponseDTO(CompanyApplication application) {
        return CompanyApplicationResponseDTO.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .userEmail(application.getUser().getEmail())
                .applicationType(application.getApplicationType())
                .targetCompanyId(application.getTargetCompany() != null ? application.getTargetCompany().getId() : null)
                .targetCompanyName(application.getTargetCompany() != null ? application.getTargetCompany().getCompanyName() : null)
                .proposedCompanyName(application.getProposedCompanyName())
                .description(application.getDescription())
                .phone(application.getPhone())
                .companyEmail(application.getCompanyEmail())
                .website(application.getWebsite())
                .city(application.getCity())
                .district(application.getDistrict())
                .fullAddress(application.getFullAddress())
                .status(application.getStatus())
                .rejectionReason(application.getRejectionReason())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
