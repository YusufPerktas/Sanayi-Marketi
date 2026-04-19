package com.sanayimarketi.controller;

import com.sanayimarketi.dto.UserResponseDTO;
import com.sanayimarketi.dto.UserUpdateRequestDTO;
import com.sanayimarketi.entity.User;
import com.sanayimarketi.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMe(@RequestAttribute("userId") Long userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(toDTO(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMe(
            @Valid @RequestBody UserUpdateRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        User updated = userService.updateCredentials(
                userId,
                request.getCurrentPassword(),
                request.getNewEmail(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(toDTO(updated));
    }

    private UserResponseDTO toDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
