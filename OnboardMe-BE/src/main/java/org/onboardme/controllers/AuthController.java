package org.onboardme.controllers;

import com.onboardme.api.AuthApi;
import com.onboardme.model.LoginRequestDTO;
import com.onboardme.model.LoginResponseDTO;
import org.onboardme.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class AuthController implements AuthApi {

    @Autowired
    private AuthService authService;

    @Override
    public ResponseEntity<LoginResponseDTO> loginUser(LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
