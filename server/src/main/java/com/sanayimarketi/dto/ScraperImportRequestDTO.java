package com.sanayimarketi.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScraperImportRequestDTO {
    private String companyName;
    private String website;
    private List<String> sectors;
    private String phone;
    private String email;
    private String city;
    private String district;
    private String address;
    private String catalogFile;   // tek katalog dosyası adı (null = katalog yok)
    private String logoUrl;
    private String description;
}
