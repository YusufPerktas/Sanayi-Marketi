package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteCompanyResponseDTO {

    private Long companyId;
    private String companyName;
    private String city;
    private String district;
    private LocalDateTime favoritedAt;
}
