package com.sanayimarketi.dto;

import com.sanayimarketi.entity.enums.CompanyApplicationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterCompanyRequestDTO {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    @NotNull
    private CompanyApplicationType applicationType;

    private String proposedCompanyName;

    private String description;

    private String phone;

    private String companyEmail;

    private String website;

    private String city;

    private String district;

    private String fullAddress;

    private Long targetCompanyId;
}
