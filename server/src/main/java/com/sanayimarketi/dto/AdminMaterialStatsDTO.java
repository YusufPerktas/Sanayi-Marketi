package com.sanayimarketi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMaterialStatsDTO {

    private long total;
    private long userCreated;
    private long unused;
    private long suspicious;
}
