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

    List<Company> findByStatusNot(CompanyStatus status);

    List<Company> findByCompanyNameContainingIgnoreCase(String name);

    Page<Company> findAllByCompanyNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Company> findAllByCityIgnoreCase(String city, Pageable pageable);

    @Query("SELECT c FROM Company c WHERE " +
           "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :name, '%')) AND " +
           "LOWER(c.city) = LOWER(:city)")
    Page<Company> findByNameAndCity(@Param("name") String name,
                                    @Param("city") String city,
                                    Pageable pageable);
}
