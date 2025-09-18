package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "exam_option")
public class ExamOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    private Boolean correct;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private ExamQuestion question;
}