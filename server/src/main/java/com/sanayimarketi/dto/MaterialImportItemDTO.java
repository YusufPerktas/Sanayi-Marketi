package com.sanayimarketi.dto;

import lombok.Data;

@Data
public class MaterialImportItemDTO {
    private String materialName;
    private Long companyId;   // opsiyonel — CompanyMaterial bağlantısı için
}
