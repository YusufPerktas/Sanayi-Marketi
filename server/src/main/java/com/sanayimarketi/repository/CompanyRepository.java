package com.sanayimarketi.repository;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.enums.CompanyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findByStatus(CompanyStatus status);

    List<Company> findByCompanyNameContainingIgnoreCase(String name);

    @Query("SELECT c FROM Company c WHERE " +
           "(:name IS NULL OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:city IS NULL OR LOWER(c.city) = LOWER(:city))")
    Page<Company> findFiltered(@Param("name") String name,
                               @Param("city") String city,
                               Pageable pageable);
}
