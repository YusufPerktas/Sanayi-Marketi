package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CompanyMaterialRole;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyMaterialRequestDTO {

    @NotNull(message = "Material ID is required")
    private Long materialId;

    @NotNull(message = "Role is required")
    private CompanyMaterialRole role;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be non-negative")
    private BigDecimal price;
}
