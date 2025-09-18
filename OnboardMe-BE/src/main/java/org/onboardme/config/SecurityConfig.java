package org.onboardme.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    //Dejo la WHITE_LIST que va a servir para dar permisos a las URL mas adelante, para el tema login.
    private static final String[] WHITE_LIST_URL = {
            "/auth/login/**",
            "/auth/register/**",
            "/v1/api-docs/**",
            "/v2/api-docs/**",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-resources",
            "/swagger-resources/**",
            "/configuration/ui",
            "/configuration/security",
            "/swagger-ui/**",
            "/swagger/**",
            "/webjars/**",
            "/swagger-ui.html",
            "/api/docs",
            "/users/**", //SACAR AL IMPLEMENTAR LOGIN
            "/courses/**", //SACAR AL IMPLEMENTAR LOGIN
            "/sections/**",
            "/files/**",
            "/metrics",
            "/notifications/**",
            "/onboardMe/**"
    };

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        System.out.println("CORS config loaded");

        CorsConfiguration cc = new CorsConfiguration();
        cc.setAllowedOrigins(Arrays.asList(
                "http://onboardme-frontend.s3-website-us-east-1.amazonaws.com",
                "http://localhost:3000"
        ));
        cc.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cc.setMaxAge(3600L);
        cc.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "Access-Control-Allow-Origin"));
        cc.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cc);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(WHITE_LIST_URL).permitAll()
                        .anyRequest().authenticated()
                );

        return http.build();
    }

}
