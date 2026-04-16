package com.sanayimarketi.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.sanayimarketi.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtService {

    @Value("${spring.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${spring.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    /**
     * Generates an access token for the given user.
     * Token type is set to "ACCESS".
     */
    public String generateAccessToken(User user) {
        return buildToken(user, accessTokenExpiration, "ACCESS");
    }

    /**
     * Generates a refresh token for the given user.
     * Token type is set to "REFRESH".
     */
    public String generateRefreshToken(User user) {
        return buildToken(user, refreshTokenExpiration, "REFRESH");
    }

    /**
     * Extracts the user email (subject) from the token.
     * @throws JwtException if token is invalid or expired
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the user ID from the token claims.
     * @throws JwtException if token is invalid or expired
     */
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> ((Number) claims.get("userId")).longValue());
    }

    /**
     * Extracts the user role from the token claims.
     * @throws JwtException if token is invalid or expired
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> (String) claims.get("role"));
    }

    /**
     * Extracts the token type from the token claims.
     * Returns "ACCESS" or "REFRESH".
     * @throws JwtException if token is invalid or expired
     */
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> (String) claims.get("tokenType"));
    }

    /**
     * Validates the token signature and checks if it's not expired.
     * @return true if token is valid (not expired and well-formed)
     */
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Checks if the token has expired.
     * @return true if token is expired
     * @throws JwtException if token is invalid or malformed
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Extracts a claim from the token using a function.
     * @throws JwtException if token is invalid or expired
     */
    private <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claimsResolver.apply(claims);
    }

    /**
     * Builds a token with the specified expiration and token type.
     */
    private String buildToken(User user, long expirationTime, String tokenType) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("tokenType", tokenType)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generates the signing key from the JWT secret.
     * The secret is decoded from hex string to bytes.
     */
    private SecretKey getSigningKey() {
        byte[] decodedKey = parseHexKey(jwtSecret);
        return Keys.hmacShaKeyFor(decodedKey);
    }

    /**
     * Parses a hex-encoded secret string to bytes.
     */
    private byte[] parseHexKey(String hexSecret) {
        byte[] bytes = new byte[hexSecret.length() / 2];
        for (int i = 0; i < bytes.length; i++) {
            int index = i * 2;
            int v = Integer.parseInt(hexSecret.substring(index, index + 2), 16);
            bytes[i] = (byte) v;
        }
        return bytes;
    }
}
