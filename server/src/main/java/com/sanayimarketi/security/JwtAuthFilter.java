package com.sanayimarketi.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * JWT authentication filter that extracts and validates tokens from the Authorization header.
 * 
 * Behavior:
 * - Extracts Bearer token from "Authorization: Bearer <token>" header
 * - If no token present, continues without error (public endpoints handle this)
 * - If token present:
 *   - Validates token signature and expiration
 *   - Checks that tokenType is "ACCESS" (rejects REFRESH tokens used as access tokens)
 *   - If valid: sets SecurityContext and request attributes "userId" and "userRole"
 *   - If invalid/expired: continues without setting authentication
 *     (protected endpoints are rejected by SecurityConfig rules)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String USER_ID_ATTRIBUTE = "userId";
    private static final String USER_ROLE_ATTRIBUTE = "userRole";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String token = extractTokenFromRequest(request);

            // If no token present, continue without authentication
            if (token == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Validate token signature and expiration
            if (!jwtService.isTokenValid(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            // Extract token type and verify it's an ACCESS token
            String tokenType = jwtService.extractTokenType(token);
            if (!"ACCESS".equals(tokenType)) {
                filterChain.doFilter(request, response);
                return;
            }

            // Extract claims and set security context
            String email = jwtService.extractEmail(token);
            Long userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            // Set request attributes for controller access
            request.setAttribute(USER_ID_ATTRIBUTE, userId);
            request.setAttribute(USER_ROLE_ATTRIBUTE, role);

            filterChain.doFilter(request, response);

        } catch (JwtException | IllegalArgumentException e) {
            // Invalid token format or extraction error; continue without authentication
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Extracts the JWT token from the Authorization header.
     * Expected format: "Bearer <token>"
     * @return the token string, or null if not found or malformed
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
