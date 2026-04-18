package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.FavoriteMaterialResponseDTO;
import com.sanayimarketi.entity.UserFavoriteCompany;
import com.sanayimarketi.entity.UserFavoriteMaterial;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FavoriteMapper {

    private final CompanyMapper companyMapper;

    public CompanyResponseDTO toCompanyResponseDTO(UserFavoriteCompany favorite) {
        return companyMapper.toResponseDTO(favorite.getCompany());
    }

    public FavoriteMaterialResponseDTO toMaterialResponseDTO(UserFavoriteMaterial favorite) {
        return FavoriteMaterialResponseDTO.builder()
                .materialId(favorite.getMaterial().getId())
                .materialName(favorite.getMaterial().getMaterialName())
                .favoritedAt(favorite.getCreatedAt())
                .build();
    }
}
