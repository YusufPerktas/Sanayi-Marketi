package com.sanayimarketi.controller;

import com.sanayimarketi.dto.AuthResponseDTO;
import com.sanayimarketi.dto.LoginRequestDTO;
import com.sanayimarketi.dto.RegisterRequestDTO;
import com.sanayimarketi.entity.User;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.security.JwtService;
import com.sanayimarketi.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final long REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Register a new user.
     * Generates access token (returned in body) and refresh token (set as HttpOnly cookie).
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request,
            HttpServletResponse response) {

        // Check if email is already taken
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email is already registered");
        }

        // Register user (password is hashed by UserService)
        User user = userService.registerUser(
                request.getEmail(),
                request.getPassword(),
                request.getRole()
        );

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Set refresh token as HttpOnly cookie
        setRefreshTokenCookie(response, refreshToken);

        // Return access token and user info
        AuthResponseDTO responseDto = AuthResponseDTO.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .role(user.getRole())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    /**
     * Login with email and password.
     * Generates access token (returned in body) and refresh token (set as HttpOnly cookie).
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletResponse response) {

        // Find user by email
        User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Set refresh token as HttpOnly cookie
        setRefreshTokenCookie(response, refreshToken);

        // Return access token and user info
        AuthResponseDTO responseDto = AuthResponseDTO.builder()
                .accessToken(accessToken)
                .userId(user.getId())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(responseDto);
    }

    /**
     * Refresh the access token using the refresh token from cookie.
     * Returns a new access token in the response body.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        // Extract refresh token from cookie
        String refreshToken = extractRefreshTokenFromCookie(request);

        if (refreshToken == null) {
            return createErrorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "Refresh token is missing",
                    request.getRequestURI()
            );
        }

        // Validate refresh token
        if (!jwtService.isTokenValid(refreshToken)) {
            return createErrorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Refresh token is invalid or expired",
                    request.getRequestURI()
            );
        }

        // Check that token type is REFRESH
        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"REFRESH".equals(tokenType)) {
            return createErrorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_TOKEN",
                    "Token is not a refresh token",
                    request.getRequestURI()
            );
        }

        // Extract user email and load user
        String email = jwtService.extractEmail(refreshToken);
        User user = userService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(user);

        // Return new access token (do NOT rotate refresh token)
        AuthResponseDTO responseDto = AuthResponseDTO.builder()
                .accessToken(newAccessToken)
                .userId(user.getId())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(responseDto);
    }

    /**
     * Logout the user by clearing the refresh token cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse response) {
        // Clear refresh token cookie by setting maxAge to 0
        clearRefreshTokenCookie(response);

        // Return success message
        Map<String, String> responseBody = new LinkedHashMap<>();
        responseBody.put("message", "Logged out successfully");

        return ResponseEntity.ok(responseBody);
    }

    /**
     * Sets the refresh token as an HttpOnly, Secure cookie.
     * Note: secure is set to false for development. Must be true in production.
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        String cookieValue = String.format(
                "%s=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=Strict",
                REFRESH_TOKEN_COOKIE_NAME,
                refreshToken,
                REFRESH_TOKEN_MAX_AGE
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /**
     * Clears the refresh token cookie by setting maxAge to 0.
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        String cookieValue = String.format(
                "%s=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict",
                REFRESH_TOKEN_COOKIE_NAME
        );
        response.addHeader("Set-Cookie", cookieValue);
    }

    /**
     * Extracts the refresh token from cookies.
     */
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie cookie : cookies) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /**
     * Creates a standardized error response.
     */
    private ResponseEntity<Map<String, Object>> createErrorResponse(
            HttpStatus status,
            String error,
            String message,
            String path) {
        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("status", status.value());
        errorResponse.put("path", path);
        errorResponse.put("timestamp", LocalDateTime.now().format(ISO_FORMATTER));
        return ResponseEntity.status(status).body(errorResponse);
    }
}
