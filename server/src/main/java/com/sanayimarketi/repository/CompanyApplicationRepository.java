package com.sanayimarketi.repository;

import com.sanayimarketi.entity.CompanyApplication;
import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyApplicationRepository extends JpaRepository<CompanyApplication, Long> {

    List<CompanyApplication> findByStatus(CompanyApplicationStatus status);

    List<CompanyApplication> findByUserId(Long userId);

    List<CompanyApplication> findByStatusOrderByCreatedAtAsc(CompanyApplicationStatus status);

    Optional<CompanyApplication> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
