package com.sanayimarketi.entity;

import com.sanayimarketi.entity.enums.CompanyApplicationStatus;
import com.sanayimarketi.entity.enums.CompanyApplicationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_type", nullable = false)
    private CompanyApplicationType applicationType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_company_id")
    private Company targetCompany;

    @Column(name = "proposed_company_name", length = 255)
    private String proposedCompanyName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "company_email", length = 255)
    private String companyEmail;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "full_address", columnDefinition = "TEXT")
    private String fullAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CompanyApplicationStatus status;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = CompanyApplicationStatus.PENDING;
        }
    }
}
