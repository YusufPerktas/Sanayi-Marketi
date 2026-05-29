package com.sanayimarketi.dto;

import lombok.Data;

@Data
public class CatalogAnalyzeRequestDTO {
    private String companyName;
    private Integer testDir; // null → catalogs/, non-null → tests/test-{N}/
}
