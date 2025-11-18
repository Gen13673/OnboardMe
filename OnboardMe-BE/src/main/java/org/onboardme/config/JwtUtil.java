package org.onboardme.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.entities.UsuarioSeguridad;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final long EXPIRATION_TIME = 86400000; // 1 día
    private static final String SECRET_KEY = "3f7df7896049e29b02d22c8cca51b8763c337ceb5ebdc06345312028f4b016d5";

    public String generateToken(
            final Long usuarioId,
            final String username,
            final String email,
            final String roles
    ) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("roles", roles);
        extraClaims.put("username", username);
        final LocalDateTime dueDateToken = LocalDateTime
                .now()
                .plusMinutes(EXPIRATION_TIME)
                .atZone(ZoneId.of("UTC"))
                .toLocalDateTime();
        final Date expirationDate = Date.from(dueDateToken.atZone(ZoneId.systemDefault()).toInstant());
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setId(usuarioId.toString())
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(expirationDate)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractName(final String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(final String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(final String token, UserDetails userDetails) {
        final String userEmail = extractName(token);
        return (userEmail.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(final String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(final String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public UsuarioSeguridad validateAndGetSecurity(
            final String token
    ) {
        Claims claims = extractAllClaims(token);
        UsuarioSeguridad security = new UsuarioSeguridad(claims);
        return security;
    }

    public Claims extractAllClaims(
            final String token
    ) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
