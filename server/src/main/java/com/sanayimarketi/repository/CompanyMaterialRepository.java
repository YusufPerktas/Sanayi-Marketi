package com.sanayimarketi.repository;

import com.sanayimarketi.entity.CompanyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyMaterialRepository extends JpaRepository<CompanyMaterial, Long> {

    List<CompanyMaterial> findByCompanyId(Long companyId);

    List<CompanyMaterial> findByMaterialId(Long materialId);

    Optional<CompanyMaterial> findByCompanyIdAndMaterialId(Long companyId, Long materialId);

    List<CompanyMaterial> findByMaterialIdOrderByPriceAsc(Long materialId);
}
