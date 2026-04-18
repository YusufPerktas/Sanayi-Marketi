package com.sanayimarketi;

import com.sanayimarketi.entity.enums.UserRole;
import com.sanayimarketi.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserService userService;

    @Override
    public void run(String... args) {
        String email = "admin@sanayimarketi.com";
        if (userService.findByEmail(email).isPresent()) {
            log.info("Admin user already exists, skipping.");
            return;
        }
        userService.registerUser(email, "admin", UserRole.ADMIN);
        log.info("Admin user created: {}", email);
    }
}
