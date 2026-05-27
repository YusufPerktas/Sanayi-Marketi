package com.sanayimarketi.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScraperRunRequestDTO {
    private String companyName;
    private String website;
    private List<String> sectors;
}
