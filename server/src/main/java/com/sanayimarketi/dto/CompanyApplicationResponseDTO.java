package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import com.sanayimarketi.entity.enums.CompanyApplicationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyApplicationResponseDTO {

    private Long id;
    private Long userId;
    private String userEmail;
    private CompanyApplicationType applicationType;
    private Long targetCompanyId;
    private String targetCompanyName;
    private String proposedCompanyName;
    private String description;
    private String phone;
    private String companyEmail;
    private String website;
    private String city;
    private String district;
    private String fullAddress;
    private CompanyApplicationStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
