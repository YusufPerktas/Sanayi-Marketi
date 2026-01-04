package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CompanyApplicationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyApplicationRequestDTO {

    @NotNull(message = "Application type is required")
    private CompanyApplicationType type;

    private Long targetCompanyId;

    @Size(max = 255, message = "Proposed company name must not exceed 255 characters")
    private String proposedCompanyName;
}
