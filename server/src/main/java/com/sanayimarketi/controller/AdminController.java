package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CompanyService companyService;
    private final CompanyMapper companyMapper;

    @PostMapping("/companies/{primaryId}/merge/{secondaryId}")
    public ResponseEntity<Void> mergeCompanies(
            @PathVariable Long primaryId,
            @PathVariable Long secondaryId) {
        companyService.mergeCompanies(primaryId, secondaryId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/companies/{id}/status")
    public ResponseEntity<CompanyResponseDTO> changeCompanyStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        CompanyStatus newStatus = CompanyStatus.valueOf(body.get("status"));
        Company updated = companyService.changeStatus(id, newStatus);
        return ResponseEntity.ok(companyMapper.toResponseDTO(updated));
    }
}
