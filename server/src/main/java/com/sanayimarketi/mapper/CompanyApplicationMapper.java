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
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
