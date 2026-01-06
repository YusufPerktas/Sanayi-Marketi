package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CompanyMaterialRole;
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
public class CompanyMaterialResponseDTO {

    private Long id;
    private Long companyId;
    private String companyName;
    private Long materialId;
    private String materialName;
    private CompanyMaterialRole role;
    private BigDecimal price;
    private LocalDateTime createdAt;
}
