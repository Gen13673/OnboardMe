package org.onboardme.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "usuario_x_curso", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"Id_Usuario", "Id_Curso"})
})
public class Enrollment {

    @EmbeddedId
    private EnrollmentId id;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name = "Id_Usuario", referencedColumnName = "Id_Legajo", nullable = false)
    private User user;

    @ManyToOne
    @MapsId("courseId")
    @JoinColumn(name = "Id_Curso", referencedColumnName = "Id", nullable = false)
    private Course course;

    @Column(name = "Fecha_asignacion")
    private Date enrolledAt;

    @Column(name = "Fecha_finalizacion")
    private Date finishedDate;

    @Column(name = "Estado")
    private String status;

    @Column(name = "Marca_Fav")
    private Boolean favorite;

    @ManyToOne
    @JoinColumn(name = "Id_Seccion", referencedColumnName = "Id")
    Section section;


}