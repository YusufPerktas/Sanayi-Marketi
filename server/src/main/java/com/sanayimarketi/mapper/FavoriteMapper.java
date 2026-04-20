package com.sanayimarketi.mapper;

import com.sanayimarketi.dto.CompanyResponseDTO;
import com.sanayimarketi.dto.MaterialResponseDTO;
import com.sanayimarketi.entity.UserFavoriteCompany;
import com.sanayimarketi.entity.UserFavoriteMaterial;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FavoriteMapper {

    private final CompanyMapper companyMapper;
    private final MaterialMapper materialMapper;

    public CompanyResponseDTO toCompanyResponseDTO(UserFavoriteCompany favorite) {
        return companyMapper.toResponseDTO(favorite.getCompany());
    }

    public MaterialResponseDTO toMaterialResponseDTO(UserFavoriteMaterial favorite) {
        return materialMapper.toResponseDTO(favorite.getMaterial());
    }
}
