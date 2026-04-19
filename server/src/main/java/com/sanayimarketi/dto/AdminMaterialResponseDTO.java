package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMaterialResponseDTO {

    private Long id;
    private String materialName;
    private String normalizedName;
    private Long parentMaterialId;
    private String parentMaterialName;
    private long usageCount;
    private LocalDateTime createdAt;
    private Long createdByCompanyId;
    private String createdByCompanyName;
    private boolean userCreated;
    private boolean suspicious;
}
