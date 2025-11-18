package org.onboardme.dao.entities;

import io.jsonwebtoken.Claims;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioSeguridad {

    private Long id;
    private String name;
    private String role;
    private String email;
    private LocalDateTime createdAt;

    public UsuarioSeguridad(Claims claims) {
        this.id = Long.parseLong(claims.getId());
        this.email = claims.getSubject();
        this.name = claims.get("username", String.class);
        this.role = claims.get("roles", String.class);
        this.createdAt = Instant.ofEpochMilli(claims.getIssuedAt().getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
}
