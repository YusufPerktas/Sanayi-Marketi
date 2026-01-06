package com.sanayimarketi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialCreateRequestDTO {

    @NotBlank(message = "Material name is required")
    @Size(max = 255, message = "Material name must not exceed 255 characters")
    private String materialName;

    private Long parentMaterialId;
}
