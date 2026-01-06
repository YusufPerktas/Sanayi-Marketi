package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.CompanyMaterial;
import com.sanayimarketi.entity.Material;
import com.sanayimarketi.entity.enums.CompanyMaterialRole;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyMaterialRepository;
import com.sanayimarketi.repository.CompanyRepository;
import com.sanayimarketi.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyMaterialService {

    private final CompanyMaterialRepository companyMaterialRepository;
    private final CompanyRepository companyRepository;
    private final MaterialRepository materialRepository;

    public List<CompanyMaterial> getCompanyMaterials(Long companyId) {
        return companyMaterialRepository.findByCompanyId(companyId);
    }

    public List<CompanyMaterial> getMaterialSuppliers(Long materialId) {
        return companyMaterialRepository.findByMaterialId(materialId);
    }

    public List<CompanyMaterial> getMaterialSuppliersByPrice(Long materialId) {
        return companyMaterialRepository.findByMaterialIdOrderByPriceAsc(materialId);
    }

    public CompanyMaterial getCompanyMaterialById(Long id) {
        return companyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CompanyMaterial", id));
    }

    @Transactional
    public CompanyMaterial addMaterialToCompany(Long companyId, Long materialId, CompanyMaterialRole role, BigDecimal price) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", materialId));

        if (companyMaterialRepository.findByCompanyIdAndMaterialId(companyId, materialId).isPresent()) {
            throw new IllegalArgumentException("This material is already associated with the company");
        }

        CompanyMaterial companyMaterial = CompanyMaterial.builder()
                .company(company)
                .material(material)
                .role(role)
                .price(price)
                .build();

        return companyMaterialRepository.save(companyMaterial);
    }

    @Transactional
    public CompanyMaterial updateCompanyMaterial(Long id, CompanyMaterialRole role, BigDecimal price) {
        CompanyMaterial companyMaterial = getCompanyMaterialById(id);
        companyMaterial.setRole(role);
        companyMaterial.setPrice(price);
        return companyMaterialRepository.save(companyMaterial);
    }

    @Transactional
    public void removeCompanyMaterial(Long id) {
        CompanyMaterial companyMaterial = getCompanyMaterialById(id);
        companyMaterialRepository.delete(companyMaterial);
    }
}
