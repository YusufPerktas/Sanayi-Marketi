package com.sanayimarketi.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Handles authentication errors when an unauthenticated request hits a protected endpoint.
 * Writes a JSON error response in the locked format.
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException, ServletException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Build error response in locked format as JSON string
        String timestamp = LocalDateTime.now().format(ISO_FORMATTER);
        String path = request.getRequestURI();
        
        String jsonResponse = String.format(
                "{\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required\",\"status\":401,\"path\":\"%s\",\"timestamp\":\"%s\"}",
                path, timestamp
        );

        try (var writer = response.getWriter()) {
            writer.write(jsonResponse);
        }
    }
}
