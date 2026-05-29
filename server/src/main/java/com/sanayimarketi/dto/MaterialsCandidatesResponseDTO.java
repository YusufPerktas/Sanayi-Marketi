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
public class MaterialsCandidatesResponseDTO {
    private String companyName;
    private String catalogFile;
    private String analyzedAt;
    private String extractionMethod;
    private List<MaterialCandidateDTO> candidates;
    private Integer totalCandidates;
    private String status; // PENDING_REVIEW | REVIEWED
}
