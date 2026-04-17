package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.CompanyUpdateRequestDTO;
import com.sanayimarketi.dto.PagedResponseDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    public ResponseEntity<PagedResponseDTO<CompanyResponseDTO>> getAllCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Company> companyPage = companyService.getAllCompanies(PageRequest.of(page, size));
        List<CompanyResponseDTO> content = companyPage.getContent().stream()
                .map(companyMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(new PagedResponseDTO<>(
                content,
                companyPage.getNumber(),
                companyPage.getSize(),
                companyPage.getTotalElements(),
                companyPage.getTotalPages(),
                companyPage.isFirst(),
                companyPage.isLast()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponseDTO> getCompanyById(@PathVariable Long id) {
        Company company = companyService.getCompanyById(id);
        return ResponseEntity.ok(companyMapper.toResponseDTO(company));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponseDTO> updateCompany(
            @PathVariable Long id,
            @Valid @RequestBody CompanyUpdateRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        Company companyDetails = companyMapper.toEntity(request);
        Company updatedCompany = companyService.updateCompany(id, companyDetails, userId);
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
