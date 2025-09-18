package org.onboardme.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "curso")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "Titulo")
    private String title;

    @Column(name = "Descripcion")
    private String description;

    @Column(name = "Area")
    private String area;

    @Column(name = "Fecha_creacion")
    private Date createdDate;

    @Column(name = "Fecha_vencimiento")
    private Date expiryDate;

    @ManyToOne
    @JoinColumn(name = "Id_Usuario_Creador", referencedColumnName = "Id_Legajo")
    private User createdBy;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Section> sections = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrollment> enrollments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdDate = new Date();
    }

}
