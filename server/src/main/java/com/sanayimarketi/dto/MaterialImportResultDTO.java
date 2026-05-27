package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MaterialImportResultDTO {
    private int created;
    private List<String> duplicates;
    private List<String> errors;
}
