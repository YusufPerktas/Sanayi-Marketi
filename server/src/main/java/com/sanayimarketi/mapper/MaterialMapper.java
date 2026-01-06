package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.MaterialResponseDTO;
import com.sanayimarketi.entity.Material;
import org.springframework.stereotype.Component;

@Component
public class MaterialMapper {

    public MaterialResponseDTO toResponseDTO(Material material) {
        return MaterialResponseDTO.builder()
                .id(material.getId())
                .materialName(material.getMaterialName())
                .normalizedName(material.getNormalizedName())
                .parentMaterialId(material.getParentMaterial() != null ? material.getParentMaterial().getId() : null)
                .parentMaterialName(material.getParentMaterial() != null ? material.getParentMaterial().getMaterialName() : null)
                .build();
    }
}
