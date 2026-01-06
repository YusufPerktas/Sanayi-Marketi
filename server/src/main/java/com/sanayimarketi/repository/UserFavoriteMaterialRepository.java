package com.sanayimarketi.repository;

import com.sanayimarketi.entity.UserFavoriteMaterial;
import com.sanayimarketi.entity.UserFavoriteMaterialId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteMaterialRepository extends JpaRepository<UserFavoriteMaterial, UserFavoriteMaterialId> {

    List<UserFavoriteMaterial> findByIdUserId(Long userId);

    boolean existsByIdUserIdAndIdMaterialId(Long userId, Long materialId);

    void deleteByIdUserIdAndIdMaterialId(Long userId, Long materialId);
}
