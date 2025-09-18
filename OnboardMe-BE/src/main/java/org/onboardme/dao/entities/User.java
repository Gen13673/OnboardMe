package org.onboardme.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuario")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_Legajo")
    private Long id;

    @Column(name = "Nombre")
    private String firstName;

    @Column(name = "Apellido")
    private String lastName;

    @Column(name = "Email")
    private String email;

    @Column(name = "Contrasenia")
    private String password;

    @Column(name = "Area")
    private String area;

    @Column(name = "Fecha_alta")
    private Date createdDate;

    @Column(name = "Estado")
    private Integer status;

    @Column(name = "Direccion")
    private String address;

    @Column(name = "Telefono")
    private String phone;

    @Column(name = "FechaNacimiento")
    private Date birthDate;

    @ManyToOne
    @JoinColumn(name = "Id_Rol", referencedColumnName = "Id")
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrollment> enrollments;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Notification> notifications;

    @ManyToOne
    @JoinColumn(name = "buddy_id")
    private User buddy;
}
