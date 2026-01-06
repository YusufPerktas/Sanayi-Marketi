package com.sanayimarketi.controller;

import com.sanayimarketi.dto.CompanyMaterialRequestDTO;
import com.sanayimarketi.dto.CompanyMaterialResponseDTO;
import com.sanayimarketi.dto.MaterialCreateRequestDTO;
import com.sanayimarketi.dto.MaterialResponseDTO;
import com.sanayimarketi.entity.CompanyMaterial;
import com.sanayimarketi.entity.Material;
import com.sanayimarketi.mapper.CompanyMaterialMapper;
import com.sanayimarketi.mapper.MaterialMapper;
import com.sanayimarketi.service.CompanyMaterialService;
import com.sanayimarketi.service.MaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;
    private final CompanyMaterialService companyMaterialService;
    private final MaterialMapper materialMapper;
    private final CompanyMaterialMapper companyMaterialMapper;

    @GetMapping
    public ResponseEntity<List<MaterialResponseDTO>> getAllMaterials() {
        List<MaterialResponseDTO> materials = materialService.getAllMaterials()
                .stream()
                .map(materialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(materials);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> getMaterialById(@PathVariable Long id) {
        Material material = materialService.getMaterialById(id);
        return ResponseEntity.ok(materialMapper.toResponseDTO(material));
    }

    @GetMapping("/root")
    public ResponseEntity<List<MaterialResponseDTO>> getRootMaterials() {
        List<MaterialResponseDTO> materials = materialService.getRootMaterials()
                .stream()
                .map(materialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(materials);
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<MaterialResponseDTO>> getChildMaterials(@PathVariable Long id) {
        List<MaterialResponseDTO> materials = materialService.getChildMaterials(id)
                .stream()
                .map(materialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(materials);
    }

    @GetMapping("/search")
    public ResponseEntity<List<MaterialResponseDTO>> searchMaterials(@RequestParam String name) {
        List<MaterialResponseDTO> materials = materialService.searchMaterials(name)
                .stream()
                .map(materialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(materials);
    }

    @PostMapping
    public ResponseEntity<MaterialResponseDTO> createMaterial(
            @Valid @RequestBody MaterialCreateRequestDTO request) {
        Material material = materialService.createMaterial(
                request.getMaterialName(),
                request.getParentMaterialId()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(materialMapper.toResponseDTO(material));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialResponseDTO> updateMaterial(
            @PathVariable Long id,
            @Valid @RequestBody MaterialCreateRequestDTO request) {
        Material material = materialService.updateMaterial(
                id,
                request.getMaterialName(),
                request.getParentMaterialId()
        );
        return ResponseEntity.ok(materialMapper.toResponseDTO(material));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/suppliers")
    public ResponseEntity<List<CompanyMaterialResponseDTO>> getMaterialSuppliers(@PathVariable Long id) {
        List<CompanyMaterialResponseDTO> suppliers = companyMaterialService.getMaterialSuppliersByPrice(id)
                .stream()
                .map(companyMaterialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<List<CompanyMaterialResponseDTO>> getCompanyMaterials(@PathVariable Long companyId) {
        List<CompanyMaterialResponseDTO> materials = companyMaterialService.getCompanyMaterials(companyId)
                .stream()
                .map(companyMaterialMapper::toResponseDTO)
                .toList();
        return ResponseEntity.ok(materials);
    }

    @PostMapping("/companies/{companyId}")
    public ResponseEntity<CompanyMaterialResponseDTO> addMaterialToCompany(
            @PathVariable Long companyId,
            @Valid @RequestBody CompanyMaterialRequestDTO request) {
        CompanyMaterial companyMaterial = companyMaterialService.addMaterialToCompany(
                companyId,
                request.getMaterialId(),
                request.getRole(),
                request.getPrice()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(companyMaterialMapper.toResponseDTO(companyMaterial));
    }

    @PutMapping("/companies/materials/{id}")
    public ResponseEntity<CompanyMaterialResponseDTO> updateCompanyMaterial(
            @PathVariable Long id,
            @Valid @RequestBody CompanyMaterialRequestDTO request) {
        CompanyMaterial companyMaterial = companyMaterialService.updateCompanyMaterial(
                id,
                request.getRole(),
                request.getPrice()
        );
        return ResponseEntity.ok(companyMaterialMapper.toResponseDTO(companyMaterial));
    }

    @DeleteMapping("/companies/materials/{id}")
    public ResponseEntity<Void> removeCompanyMaterial(@PathVariable Long id) {
        companyMaterialService.removeCompanyMaterial(id);
        return ResponseEntity.noContent().build();
    }
}
