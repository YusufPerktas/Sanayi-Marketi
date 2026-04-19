package com.sanayimarketi.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequestDTO {

    @NotBlank(message = "Mevcut şifre zorunludur")
    private String currentPassword;

    @Email(message = "Geçerli bir e-posta adresi giriniz")
    private String newEmail;

    @Size(min = 8, message = "Yeni şifre en az 8 karakter olmalıdır")
    private String newPassword;
}
