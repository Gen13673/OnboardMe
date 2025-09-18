package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.onboardme.dao.entities.User;

import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "exam_result")
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private ExamContent exam;

    @Lob
    private String detail; // JSON with question results

    private Integer score;

    private Integer totalQuestions;

    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;
}