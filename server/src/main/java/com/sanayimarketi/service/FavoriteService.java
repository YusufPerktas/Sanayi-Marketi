package com.sanayimarketi.service;

import com.sanayimarketi.entity.*;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final UserFavoriteCompanyRepository favoriteCompanyRepository;
    private final UserFavoriteMaterialRepository favoriteMaterialRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final MaterialRepository materialRepository;

    public List<UserFavoriteCompany> getUserFavoriteCompanies(Long userId) {
        return favoriteCompanyRepository.findByIdUserId(userId);
    }

    public List<UserFavoriteMaterial> getUserFavoriteMaterials(Long userId) {
        return favoriteMaterialRepository.findByIdUserId(userId);
    }

    public boolean isCompanyFavorited(Long userId, Long companyId) {
        return favoriteCompanyRepository.existsByIdUserIdAndIdCompanyId(userId, companyId);
    }

    public boolean isMaterialFavorited(Long userId, Long materialId) {
        return favoriteMaterialRepository.existsByIdUserIdAndIdMaterialId(userId, materialId);
    }

    @Transactional
    public UserFavoriteCompany addFavoriteCompany(Long userId, Long companyId) {
        if (isCompanyFavorited(userId, companyId)) {
            throw new IllegalArgumentException("Company is already in favorites");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company", companyId));

        UserFavoriteCompanyId id = new UserFavoriteCompanyId(userId, companyId);

        UserFavoriteCompany favorite = UserFavoriteCompany.builder()
                .id(id)
                .user(user)
                .company(company)
                .build();

        return favoriteCompanyRepository.save(favorite);
    }

    @Transactional
    public void removeFavoriteCompany(Long userId, Long companyId) {
        if (!isCompanyFavorited(userId, companyId)) {
            throw new IllegalArgumentException("Company is not in favorites");
        }
        favoriteCompanyRepository.deleteByIdUserIdAndIdCompanyId(userId, companyId);
    }

    @Transactional
    public UserFavoriteMaterial addFavoriteMaterial(Long userId, Long materialId) {
        if (isMaterialFavorited(userId, materialId)) {
            throw new IllegalArgumentException("Material is already in favorites");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material", materialId));

        UserFavoriteMaterialId id = new UserFavoriteMaterialId(userId, materialId);

        UserFavoriteMaterial favorite = UserFavoriteMaterial.builder()
                .id(id)
                .user(user)
                .material(material)
                .build();

        return favoriteMaterialRepository.save(favorite);
    }

    @Transactional
    public void removeFavoriteMaterial(Long userId, Long materialId) {
        if (!isMaterialFavorited(userId, materialId)) {
            throw new IllegalArgumentException("Material is not in favorites");
        }
        favoriteMaterialRepository.deleteByIdUserIdAndIdMaterialId(userId, materialId);
    }
}
