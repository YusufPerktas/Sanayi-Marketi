package com.sanayimarketi.repository;

import com.sanayimarketi.entity.CompanyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyUserRepository extends JpaRepository<CompanyUser, Long> {

    Optional<CompanyUser> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
