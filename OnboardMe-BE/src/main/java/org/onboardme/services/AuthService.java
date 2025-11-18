package org.onboardme.services;

import com.onboardme.model.LoginRequestDTO;
import com.onboardme.model.LoginResponseDTO;
import lombok.RequiredArgsConstructor;
import org.onboardme.config.JwtUtil;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.repositories.UserRepository;
import org.onboardme.exceptions.OnboardMeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordService passwordService;

    public LoginResponseDTO login(LoginRequestDTO request) throws OnboardMeException {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (UsernameNotFoundException e) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado.");
        } catch (BadCredentialsException e) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos.");
        } catch (Exception e) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "Error al autenticar usuario.");
        }

        Optional<User> user = userRepository.findByEmail(request.getEmail());
        if (user.isEmpty()) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado.");
        }

        if (!passwordService.matches(request.getPassword(), user.get().getPassword())) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "La contraseña ingresada es incorrecta.");
        }

        String token = jwtUtil.generateToken(user.get().getId(), user.get().getFirstName() + ' ' + user.get().getLastName(), user.get().getEmail(), user.get().getRole().getName());

        return new LoginResponseDTO(
                token,
                user.get().getId(),
                user.get().getFirstName(),
                user.get().getLastName(),
                user.get().getEmail(),
                user.get().getArea(),
                user.get().getRole().getName()
        );
    }
}
