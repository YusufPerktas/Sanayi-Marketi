package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.FavoriteCompanyResponseDTO;
import com.sanayimarketi.dto.FavoriteMaterialResponseDTO;
import com.sanayimarketi.entity.UserFavoriteCompany;
import com.sanayimarketi.entity.UserFavoriteMaterial;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public FavoriteCompanyResponseDTO toCompanyResponseDTO(UserFavoriteCompany favorite) {
        return FavoriteCompanyResponseDTO.builder()
                .companyId(favorite.getCompany().getId())
                .companyName(favorite.getCompany().getCompanyName())
                .city(favorite.getCompany().getCity())
                .district(favorite.getCompany().getDistrict())
                .favoritedAt(favorite.getCreatedAt())
                .build();
    }

    public FavoriteMaterialResponseDTO toMaterialResponseDTO(UserFavoriteMaterial favorite) {
        return FavoriteMaterialResponseDTO.builder()
                .materialId(favorite.getMaterial().getId())
                .materialName(favorite.getMaterial().getMaterialName())
                .favoritedAt(favorite.getCreatedAt())
                .build();
    }
}
