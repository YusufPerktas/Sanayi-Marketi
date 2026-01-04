package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyApplicationRequestDTO;
import com.sanayimarketi.dto.CompanyApplicationResponseDTO;
import com.sanayimarketi.entity.CompanyApplication;
import com.sanayimarketi.mapper.CompanyApplicationMapper;
import com.sanayimarketi.service.CompanyApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class CompanyApplicationController {

    private final CompanyApplicationService applicationService;
    private final CompanyApplicationMapper applicationMapper;

    @PostMapping
    public ResponseEntity<CompanyApplicationResponseDTO> submitApplication(
            @Valid @RequestBody CompanyApplicationRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        // userId will be extracted from JWT token by security filter

        CompanyApplication application = applicationService.submitApplication(
                userId,
                request.getType(),
                request.getTargetCompanyId(),
                request.getProposedCompanyName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationMapper.toResponseDTO(application));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CompanyApplicationResponseDTO>> getPendingApplications() {
        // Admin-only access will be enforced by Spring Security
        List<CompanyApplicationResponseDTO> applications = applicationService.getPendingApplications()
                .stream()
                .map(applicationMapper::toResponseDTO)
                .toList();

        return ResponseEntity.ok(applications);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<CompanyApplicationResponseDTO> approveApplication(@PathVariable Long id) {
        // Admin-only access will be enforced by Spring Security
        CompanyApplication application = applicationService.approveApplication(id);
        return ResponseEntity.ok(applicationMapper.toResponseDTO(application));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<CompanyApplicationResponseDTO> rejectApplication(@PathVariable Long id) {
        // Admin-only access will be enforced by Spring Security
        CompanyApplication application = applicationService.rejectApplication(id);
        return ResponseEntity.ok(applicationMapper.toResponseDTO(application));
    }
}
