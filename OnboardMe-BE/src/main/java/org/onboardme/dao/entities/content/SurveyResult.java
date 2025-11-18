package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.onboardme.dao.entities.User;

import java.util.Date;

@Getter
@Setter
@Entity
@Table(name = "survey_result")
public class SurveyResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "survey_id")
    private SurveyContent survey;

    @Lob
    private String detail;

    private Integer totalQuestions;

    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;
}