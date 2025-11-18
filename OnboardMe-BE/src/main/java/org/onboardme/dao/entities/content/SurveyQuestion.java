package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "survey_question")
public class SurveyQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 32)
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    @ManyToOne
    @JoinColumn(name = "survey_id")
    private SurveyContent survey;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyOption> options = new ArrayList<>();

    public void setOptions(List<SurveyOption> options) {
        this.options = options;
        if (options != null) {
            for (SurveyOption o : options) {
                o.setQuestion(this);
            }
        }
    }
}