package org.onboardme.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notificacion")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "Id_Usuario_Enviado", referencedColumnName = "Id_Legajo", nullable = false)
    private User user;

    @Column(name= "Titulo")
    private String title;

    @Column(name = "Mensaje")
    private String message;

    @Column(name = "Fecha_envio")
    private Date sentDate;

    @Column(name = "Leida")
    private Boolean seen;
}
