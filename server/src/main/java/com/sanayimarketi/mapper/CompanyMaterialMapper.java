package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.CompanyMaterialResponseDTO;
import com.sanayimarketi.entity.CompanyMaterial;
import org.springframework.stereotype.Component;

@Component
public class CompanyMaterialMapper {

    public CompanyMaterialResponseDTO toResponseDTO(CompanyMaterial companyMaterial) {
        return CompanyMaterialResponseDTO.builder()
                .id(companyMaterial.getId())
                .companyId(companyMaterial.getCompany().getId())
                .companyName(companyMaterial.getCompany().getCompanyName())
                .materialId(companyMaterial.getMaterial().getId())
                .materialName(companyMaterial.getMaterial().getMaterialName())
                .role(companyMaterial.getRole())
                .price(companyMaterial.getPrice())
                .createdAt(companyMaterial.getCreatedAt())
                .build();
    }
}
