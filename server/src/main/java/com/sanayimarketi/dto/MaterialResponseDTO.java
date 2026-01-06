package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponseDTO {

    private Long id;
    private String materialName;
    private String normalizedName;
    private Long parentMaterialId;
    private String parentMaterialName;
}
