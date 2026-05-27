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

    boolean existsByMaterialNameIgnoreCase(String name);

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

    @Query("""
        SELECT m.normalizedName FROM Material m
        WHERE m.normalizedName IS NOT NULL
        GROUP BY m.normalizedName
        HAVING COUNT(m.id) > 1
        """)
    List<String> findDuplicateNormalizedNames();

    @Query("""
        SELECT COUNT(m) FROM Material m
        WHERE LENGTH(TRIM(m.materialName)) < 3
           OR (m.createdByCompanyId IS NOT NULL AND m.id NOT IN
               (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm))
           OR (m.normalizedName IS NOT NULL AND m.normalizedName IN (
               SELECT m2.normalizedName FROM Material m2
               WHERE m2.normalizedName IS NOT NULL
               GROUP BY m2.normalizedName HAVING COUNT(m2.id) > 1
           ))
        """)
    long countSuspicious();

    @Query("""
        SELECT m FROM Material m
        WHERE LENGTH(TRIM(m.materialName)) < 3
           OR (m.createdByCompanyId IS NOT NULL AND m.id NOT IN
               (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm))
           OR (m.normalizedName IS NOT NULL AND m.normalizedName IN (
               SELECT m2.normalizedName FROM Material m2
               WHERE m2.normalizedName IS NOT NULL
               GROUP BY m2.normalizedName HAVING COUNT(m2.id) > 1
           ))
        """)
    Page<Material> findSuspicious(Pageable pageable);

    @Query("""
        SELECT m FROM Material m
        WHERE LOWER(m.materialName) LIKE LOWER(CONCAT('%', :search, '%'))
          AND (
            LENGTH(TRIM(m.materialName)) < 3
            OR (m.createdByCompanyId IS NOT NULL AND m.id NOT IN
                (SELECT DISTINCT cm.material.id FROM CompanyMaterial cm))
            OR (m.normalizedName IS NOT NULL AND m.normalizedName IN (
                SELECT m2.normalizedName FROM Material m2
                WHERE m2.normalizedName IS NOT NULL
                GROUP BY m2.normalizedName HAVING COUNT(m2.id) > 1
            ))
          )
        """)
    Page<Material> findSuspiciousByName(@Param("search") String search, Pageable pageable);
}
