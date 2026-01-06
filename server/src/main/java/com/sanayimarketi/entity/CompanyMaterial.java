package com.sanayimarketi.entity;

import com.sanayimarketi.entity.enums.CompanyMaterialRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "company_materials", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "material_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private CompanyMaterialRole role;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
