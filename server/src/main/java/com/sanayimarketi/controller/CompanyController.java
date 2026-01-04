package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.CompanyUpdateRequestDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyMapper companyMapper;

    @GetMapping
    public ResponseEntity<List<CompanyResponseDTO>> getAllCompanies() {
        List<CompanyResponseDTO> companies = companyService.getAllCompanies()
                .stream()
                .map(companyMapper::toResponseDTO)
                .toList();

        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponseDTO> getCompanyById(@PathVariable Long id) {
        Company company = companyService.getCompanyById(id);
        return ResponseEntity.ok(companyMapper.toResponseDTO(company));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponseDTO> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyUpdateRequestDTO request) {
        // Authorization check will be handled by Spring Security
        Company companyDetails = companyMapper.toEntity(request);
        Company updatedCompany = companyService.updateCompany(id, companyDetails);
        return ResponseEntity.ok(companyMapper.toResponseDTO(updatedCompany));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CompanyResponseDTO>> searchCompanies(@RequestParam String name) {
        List<CompanyResponseDTO> companies = companyService.searchCompaniesByName(name)
                .stream()
                .map(companyMapper::toResponseDTO)
                .toList();

        return ResponseEntity.ok(companies);
    }
}
