package org.onboardme.dao.entities.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "exam_content")
public class ExamContent extends SectionContent {

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamQuestion> questions = new ArrayList<>();

    private Integer timeLimit; // minutes, optional

    @Override
    public String getUrl() {
        return "";
    }

    @Override
    public String getQuestion() {
        return null;
    }

    public void setQuestions(List<ExamQuestion> questions) {
        this.questions = questions;
        if (questions != null) {
            for (ExamQuestion q : questions) {
                q.setExam(this);
            }
        }
    }

    public void setSection(Section section) {
        super.setSection(section);
    }
}