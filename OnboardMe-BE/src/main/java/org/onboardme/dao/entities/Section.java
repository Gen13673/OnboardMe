package org.onboardme.dao.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "seccion")
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "Titulo")
    private String title;

    @Column(name = "Orden")
    private String order;

    @ManyToOne
    @JoinColumn(name = "Id_Curso", referencedColumnName = "Id")
    private Course course;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Enrollment> enrollments;

    @OneToOne(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    private SectionContent content;

}
