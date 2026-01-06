package com.sanayimarketi.service;

import com.sanayimarketi.entity.Material;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {

    private final MaterialRepository materialRepository;

    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    public Material getMaterialById(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
    }

    public List<Material> getRootMaterials() {
        return materialRepository.findByParentMaterialIsNull();
    }

    public List<Material> getChildMaterials(Long parentId) {
        return materialRepository.findByParentMaterialId(parentId);
    }

    public List<Material> searchMaterials(String name) {
        String normalizedSearch = name.toLowerCase().trim();
        return materialRepository.findByNormalizedNameContaining(normalizedSearch);
    }

    @Transactional
    public Material createMaterial(String materialName, Long parentMaterialId) {
        Material material = Material.builder()
                .materialName(materialName)
                .build();

        if (parentMaterialId != null) {
            Material parentMaterial = getMaterialById(parentMaterialId);
            material.setParentMaterial(parentMaterial);
        }

        return materialRepository.save(material);
    }

    @Transactional
    public Material updateMaterial(Long id, String materialName, Long parentMaterialId) {
        Material material = getMaterialById(id);
        material.setMaterialName(materialName);

        if (parentMaterialId != null) {
            if (parentMaterialId.equals(id)) {
                throw new IllegalArgumentException("Material cannot be its own parent");
            }
            Material parentMaterial = getMaterialById(parentMaterialId);
            material.setParentMaterial(parentMaterial);
        } else {
            material.setParentMaterial(null);
        }

        return materialRepository.save(material);
    }

    @Transactional
    public void deleteMaterial(Long id) {
        Material material = getMaterialById(id);
        materialRepository.delete(material);
    }
}
