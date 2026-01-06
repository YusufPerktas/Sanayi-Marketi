package com.sanayimarketi.repository;

import com.sanayimarketi.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByNormalizedNameContaining(String name);

    List<Material> findByParentMaterialId(Long parentId);

    List<Material> findByParentMaterialIsNull();
}
