package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.entity.CompanyUser;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.repository.CompanyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/company-users")
@RequiredArgsConstructor
public class CompanyUserController {

    private final CompanyUserRepository companyUserRepository;
    private final CompanyMapper companyMapper;

    @GetMapping("/me")
    @PreAuthorize("hasRole('COMPANY_USER')")
    public ResponseEntity<CompanyResponseDTO> getMyCompany(
            @RequestAttribute("userId") Long userId) {
        CompanyUser companyUser = companyUserRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyUser", userId));
        return ResponseEntity.ok(companyMapper.toResponseDTO(companyUser.getCompany()));
    }
}
