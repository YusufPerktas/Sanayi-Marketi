package com.sanayimarketi.service;

import com.sanayimarketi.entity.User;
import com.sanayimarketi.entity.enums.UserRole;
import com.sanayimarketi.exception.ResourceNotFoundException;
import com.sanayimarketi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String email, String password, UserRole role) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists: " + email);
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .build();

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Transactional
    public User updateCredentials(Long userId, String currentPassword, String newEmail, String newPassword) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Mevcut şifre hatalı");
        }

        if (newEmail != null && !newEmail.isBlank()) {
            String trimmed = newEmail.trim().toLowerCase();
            if (!trimmed.equals(user.getEmail()) && userRepository.existsByEmail(trimmed)) {
                throw new IllegalArgumentException("Bu e-posta adresi zaten kullanılıyor");
            }
            user.setEmail(trimmed);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        return userRepository.save(user);
    }
}
