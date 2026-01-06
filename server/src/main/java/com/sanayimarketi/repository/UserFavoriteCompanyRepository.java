package com.sanayimarketi.repository;

import com.sanayimarketi.entity.UserFavoriteCompany;
import com.sanayimarketi.entity.UserFavoriteCompanyId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteCompanyRepository extends JpaRepository<UserFavoriteCompany, UserFavoriteCompanyId> {

    List<UserFavoriteCompany> findByIdUserId(Long userId);

    boolean existsByIdUserIdAndIdCompanyId(Long userId, Long companyId);

    void deleteByIdUserIdAndIdCompanyId(Long userId, Long companyId);
}
