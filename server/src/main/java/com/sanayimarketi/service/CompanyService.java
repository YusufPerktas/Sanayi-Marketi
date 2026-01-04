package com.sanayimarketi.service;

import com.sanayimarketi.entity.Company;
import com.sanayimarketi.entity.enums.CompanyStatus;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public List<Company> getCompaniesByStatus(CompanyStatus status) {
        return companyRepository.findByStatus(status);
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company", id));
    }

    @Transactional
    public Company updateCompany(Long id, Company companyDetails) {
        Company company = getCompanyById(id);

        company.setCompanyName(companyDetails.getCompanyName());
        company.setDescription(companyDetails.getDescription());
        company.setCountry(companyDetails.getCountry());
        company.setCity(companyDetails.getCity());
        company.setDistrict(companyDetails.getDistrict());
        company.setFullAddress(companyDetails.getFullAddress());
        company.setPhone(companyDetails.getPhone());
        company.setEmail(companyDetails.getEmail());
        company.setWebsite(companyDetails.getWebsite());
        company.setLatitude(companyDetails.getLatitude());
        company.setLongitude(companyDetails.getLongitude());
        company.setGoogleMapsEmbedUrl(companyDetails.getGoogleMapsEmbedUrl());
        company.setCatalogFileUrl(companyDetails.getCatalogFileUrl());
        company.setCatalogFileType(companyDetails.getCatalogFileType());
        company.setStatus(companyDetails.getStatus());

        return companyRepository.save(company);
    }

    public List<Company> searchCompaniesByName(String name) {
        return companyRepository.findByCompanyNameContainingIgnoreCase(name);
    }
}
