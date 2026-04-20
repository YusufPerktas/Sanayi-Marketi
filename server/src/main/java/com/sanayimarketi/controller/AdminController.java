package com.sanayimarketi.controller;

import com.sanayimarketi.dto.AdminMaterialResponseDTO;
import com.sanayimarketi.dto.AdminMaterialStatsDTO;
import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.DuplicatePairDTO;
import com.sanayimarketi.dto.MaterialCreateRequestDTO;
import com.sanayimarketi.dto.MaterialResponseDTO;
import com.sanayimarketi.dto.PagedResponseDTO;
import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.Material;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.mapper.CompanyMapper;
import com.sanayimarketi.mapper.MaterialMapper;
import com.sanayimarketi.service.CompanyService;
import com.sanayimarketi.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CompanyService companyService;
    private final CompanyMapper companyMapper;
    private final MaterialService materialService;
    private final MaterialMapper materialMapper;

    // ── Company endpoints ──────────────────────────────────────────

    @GetMapping("/companies/duplicates")
    public ResponseEntity<List<DuplicatePairDTO>> getCompanyDuplicates() {
        return ResponseEntity.ok(companyService.findDuplicatePairs());
    }

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

    // ── Material endpoints ─────────────────────────────────────────

    @GetMapping("/materials")
    public ResponseEntity<PagedResponseDTO<AdminMaterialResponseDTO>> getAdminMaterials(
            @RequestParam(defaultValue = "ALL") String filter,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AdminMaterialResponseDTO> result = materialService.getAdminMaterials(filter, search, pageable);
        return ResponseEntity.ok(new PagedResponseDTO<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isFirst(),
                result.isLast()
        ));
    }

    @GetMapping("/materials/stats")
    public ResponseEntity<AdminMaterialStatsDTO> getAdminMaterialStats() {
        return ResponseEntity.ok(materialService.getAdminStats());
    }

    @PutMapping("/materials/{id}")
    public ResponseEntity<MaterialResponseDTO> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody MaterialCreateRequestDTO request) {
        Material updated = materialService.updateMaterial(id, request.getMaterialName(), request.getParentMaterialId());
        return ResponseEntity.ok(materialMapper.toResponseDTO(updated));
    }

    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/materials/{targetId}/merge/{sourceId}")
    public ResponseEntity<Void> mergeMaterials(
            @PathVariable Long targetId,
            @PathVariable Long sourceId) {
        materialService.mergeMaterials(targetId, sourceId);
        return ResponseEntity.ok().build();
    }
}
