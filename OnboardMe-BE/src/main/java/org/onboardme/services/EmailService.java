package org.onboardme.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendUserCreationEmail(String to, String firstName, String email, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("juancruzcaggiano@gmail.com");
        message.setTo(to);
        message.setSubject("Alta en la Plataforma OnboardMe");
        message.setText("Estimado/a " + firstName + ",\n\n" +
                "Nos complace informarle que se le ha dado de alta en nuestra plataforma.\n" +
                "Sus credenciales son las siguientes:\n\n" +
                "Email: " + email + "\n" +
                "Contraseña: " + password + "\n\n" +
                "Por favor, ingrese a la plataforma y cambie su contraseña a la brevedad.\n\n" +
                "Saludos cordiales,\n" +
                "El equipo de soporte.");

        mailSender.send(message);
    }
}
