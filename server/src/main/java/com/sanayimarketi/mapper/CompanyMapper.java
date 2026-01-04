package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.CompanyUpdateRequestDTO;
import com.sanayimarketi.entity.Company;
import org.springframework.stereotype.Component;

@Component
public class CompanyMapper {

    public CompanyResponseDTO toResponseDTO(Company company) {
        return CompanyResponseDTO.builder()
                .id(company.getId())
                .companyName(company.getCompanyName())
                .description(company.getDescription())
                .country(company.getCountry())
                .city(company.getCity())
                .district(company.getDistrict())
                .fullAddress(company.getFullAddress())
                .phone(company.getPhone())
                .email(company.getEmail())
                .website(company.getWebsite())
                .latitude(company.getLatitude())
                .longitude(company.getLongitude())
                .googleMapsEmbedUrl(company.getGoogleMapsEmbedUrl())
                .catalogFileUrl(company.getCatalogFileUrl())
                .catalogFileType(company.getCatalogFileType())
                .status(company.getStatus())
                .createdAt(company.getCreatedAt())
                .build();
    }

    public Company toEntity(CompanyUpdateRequestDTO dto) {
        return Company.builder()
                .companyName(dto.getCompanyName())
                .description(dto.getDescription())
                .country(dto.getCountry())
                .city(dto.getCity())
                .district(dto.getDistrict())
                .fullAddress(dto.getFullAddress())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .website(dto.getWebsite())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .googleMapsEmbedUrl(dto.getGoogleMapsEmbedUrl())
                .catalogFileUrl(dto.getCatalogFileUrl())
                .catalogFileType(dto.getCatalogFileType())
                .status(dto.getStatus())
                .build();
    }
}
