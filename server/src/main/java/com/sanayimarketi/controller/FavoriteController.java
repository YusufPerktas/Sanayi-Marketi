package com.sanayimarketi.controller;

import com.sanayimarketi.dto.FavoriteCompanyResponseDTO;
import com.sanayimarketi.dto.FavoriteMaterialResponseDTO;
import com.sanayimarketi.entity.UserFavoriteCompany;
import com.sanayimarketi.entity.UserFavoriteMaterial;
import com.sanayimarketi.mapper.FavoriteMapper;
import com.sanayimarketi.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final FavoriteMapper favoriteMapper;

    @GetMapping("/companies")
    public ResponseEntity<List<FavoriteCompanyResponseDTO>> getUserFavoriteCompanies(
            @RequestAttribute("userId") Long userId) {
        List<FavoriteCompanyResponseDTO> favorites = favoriteService.getUserFavoriteCompanies(userId)
                .stream()
                .map(favoriteMapper::toCompanyResponseDTO)
                .toList();
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/materials")
    public ResponseEntity<List<FavoriteMaterialResponseDTO>> getUserFavoriteMaterials(
            @RequestAttribute("userId") Long userId) {
        List<FavoriteMaterialResponseDTO> favorites = favoriteService.getUserFavoriteMaterials(userId)
                .stream()
                .map(favoriteMapper::toMaterialResponseDTO)
                .toList();
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/companies/{companyId}/check")
    public ResponseEntity<Map<String, Boolean>> checkCompanyFavorited(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long companyId) {
        boolean isFavorited = favoriteService.isCompanyFavorited(userId, companyId);
        return ResponseEntity.ok(Map.of("isFavorited", isFavorited));
    }

    @GetMapping("/materials/{materialId}/check")
    public ResponseEntity<Map<String, Boolean>> checkMaterialFavorited(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long materialId) {
        boolean isFavorited = favoriteService.isMaterialFavorited(userId, materialId);
        return ResponseEntity.ok(Map.of("isFavorited", isFavorited));
    }

    @PostMapping("/companies/{companyId}")
    public ResponseEntity<FavoriteCompanyResponseDTO> addFavoriteCompany(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long companyId) {
        UserFavoriteCompany favorite = favoriteService.addFavoriteCompany(userId, companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(favoriteMapper.toCompanyResponseDTO(favorite));
    }

    @DeleteMapping("/companies/{companyId}")
    public ResponseEntity<Void> removeFavoriteCompany(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long companyId) {
        favoriteService.removeFavoriteCompany(userId, companyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/materials/{materialId}")
    public ResponseEntity<FavoriteMaterialResponseDTO> addFavoriteMaterial(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long materialId) {
        UserFavoriteMaterial favorite = favoriteService.addFavoriteMaterial(userId, materialId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(favoriteMapper.toMaterialResponseDTO(favorite));
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<Void> removeFavoriteMaterial(
            @RequestAttribute("userId") Long userId,
            @PathVariable Long materialId) {
        favoriteService.removeFavoriteMaterial(userId, materialId);
        return ResponseEntity.noContent().build();
    }
}
