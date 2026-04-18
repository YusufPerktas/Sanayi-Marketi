package com.sanayimarketi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${catalog.upload.dir}")
    private String catalogUploadDir;

    @Value("${logo.upload.dir}")
    private String logoUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/catalogs/**")
                .addResourceLocations("file:" + catalogUploadDir + "/");
        registry.addResourceHandler("/uploads/logos/**")
                .addResourceLocations("file:" + logoUploadDir + "/");
    }
}
