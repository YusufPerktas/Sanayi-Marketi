package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CatalogFileType;
import com.sanayimarketi.entity.enums.CompanyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponseDTO {

    private Long id;
    private String companyName;
    private String description;
    private String country;
    private String city;
    private String district;
    private String fullAddress;
    private String phone;
    private String email;
    private String website;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String googleMapsEmbedUrl;
    private String catalogFileUrl;
    private CatalogFileType catalogFileType;
    private CompanyStatus status;
    private LocalDateTime createdAt;
}
