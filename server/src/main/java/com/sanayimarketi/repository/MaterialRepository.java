package com.sanayimarketi.repository;

import com.sanayimarketi.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByMaterialNameContainingIgnoreCase(String name);

    List<Material> findByParentMaterialId(Long parentId);

    List<Material> findByParentMaterialIsNull();

    Page<Material> findByMaterialNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Material> findByCreatedByCompanyIdIsNotNull(Pageable pageable);

    Page<Material> findByMaterialNameContainingIgnoreCaseAndCreatedByCompanyIdIsNotNull(String name, Pageable pageable);

    @Query("""
        SELECT m FROM Material m
        WHERE m.id NOT IN (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm)
        """)
    Page<Material> findUnused(Pageable pageable);

    @Query("""
        SELECT m FROM Material m
        WHERE m.id NOT IN (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm)
        AND LOWER(m.materialName) LIKE LOWER(CONCAT('%', :search, '%'))
        """)
    Page<Material> findUnusedByName(@Param("search") String search, Pageable pageable);

    long countByCreatedByCompanyIdIsNotNull();

    @Query("SELECT COUNT(DISTINCT m) FROM Material m WHERE m.id NOT IN (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm)")
    long countUnused();
}
