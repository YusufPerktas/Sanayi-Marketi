package com.sanayimarketi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "material_name", nullable = false, length = 255)
    private String materialName;

    @Column(name = "normalized_name", length = 255)
    private String normalizedName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_material_id")
    private Material parentMaterial;
}
