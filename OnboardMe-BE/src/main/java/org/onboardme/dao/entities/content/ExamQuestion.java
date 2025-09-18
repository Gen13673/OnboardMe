package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.onboardme.dao.entities.content.QuestionType;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "exam_question")
public class ExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 32)
    private QuestionType type = QuestionType.SINGLE_CHOICE;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private ExamContent exam;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamOption> options = new ArrayList<>();

    public void setOptions(List<ExamOption> options) {
        this.options = options;
        if (options != null) {
            for (ExamOption o : options) {
                o.setQuestion(this);
            }
        }
    }

    @PrePersist @PreUpdate
    private void normalize() {
        if (type == QuestionType.SINGLE_CHOICE && options != null) {
            boolean keepOne = true;
            for (ExamOption o : options) {
                if (Boolean.TRUE.equals(o.getCorrect())) {
                    if (keepOne) keepOne = false;
                    else o.setCorrect(false);
                }
            }
        }
    }
}