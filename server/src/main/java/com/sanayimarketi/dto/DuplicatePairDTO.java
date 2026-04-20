package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DuplicatePairDTO {
    private CompanyResponseDTO companyA;
    private CompanyResponseDTO companyB;
    private int similarityPercent;
}
