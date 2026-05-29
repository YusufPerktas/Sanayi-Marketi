package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScraperResultDTO {
    private String companyName;
    private String website;
    private List<String> sectors;
    private String status;       // SUCCESS / PARTIAL / FAILED / ERROR
    private String phone;
    private String email;
    private String address;
    private String city;
    private String district;
    private String logoUrl;
    private String description;
    private int catalogCount;
    private List<String> catalogFiles;
    private boolean imported;
    private Long companyId;    // DB'deki Company.id — import sonrası company_info.json'a yazılır
    private String scrapeDate;
    private String errorMessage;
}
