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
import java.util.Map;

@RestController
@RequestMapping("/api/company-applications")
@RequiredArgsConstructor
public class CompanyApplicationController {

    private final CompanyApplicationService applicationService;
    private final CompanyApplicationMapper applicationMapper;

    @PostMapping
    public ResponseEntity<CompanyApplicationResponseDTO> submitApplication(
            @Valid @RequestBody CompanyApplicationRequestDTO request,
            @RequestAttribute("userId") Long userId) {

        CompanyApplication application = applicationService.submitApplication(
                userId,
                request.getType(),
                request.getTargetCompanyId(),
                request.getProposedCompanyName(),
                null, null, null, null, null, null, null
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(applicationMapper.toResponseDTO(application));
    }

    @GetMapping
    public ResponseEntity<List<CompanyApplicationResponseDTO>> getAllApplications() {
        List<CompanyApplicationResponseDTO> applications = applicationService.getAllApplications()
                .stream()
                .map(applicationMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(applications);
    }

    @PostMapping("/reapply")
    public ResponseEntity<CompanyApplicationResponseDTO> reapply(
            @RequestBody Map<String, String> body,
            @RequestAttribute("userId") Long userId) {

        CompanyApplication application = applicationService.reapply(
                userId,
                body.get("proposedCompanyName"),
                body.get("description"),
                body.get("phone"),
                body.get("companyEmail"),
                body.get("website"),
                body.get("city"),
                body.get("district"),
                body.get("fullAddress")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationMapper.toResponseDTO(application));
    }

    @GetMapping("/mine")
    public ResponseEntity<CompanyApplicationResponseDTO> getMyApplication(
            @RequestAttribute("userId") Long userId) {
        return applicationService.getLatestApplicationByUserId(userId)
                .map(app -> ResponseEntity.ok(applicationMapper.toResponseDTO(app)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CompanyApplicationResponseDTO>> getPendingApplications() {
        List<CompanyApplicationResponseDTO> applications = applicationService.getPendingApplications()
                .stream()
                .map(applicationMapper::toResponseDTO)
                .toList();

        return ResponseEntity.ok(applications);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<CompanyApplicationResponseDTO> approveApplication(@PathVariable Long id) {
        CompanyApplication application = applicationService.approveApplication(id);
        return ResponseEntity.ok(applicationMapper.toResponseDTO(application));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<CompanyApplicationResponseDTO> rejectApplication(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        CompanyApplication application = applicationService.rejectApplication(id, reason);
        return ResponseEntity.ok(applicationMapper.toResponseDTO(application));
    }
}
