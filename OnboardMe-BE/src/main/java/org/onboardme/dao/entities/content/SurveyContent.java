package org.onboardme.dao.entities.content;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "survey_content")
public class SurveyContent extends SectionContent {

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyQuestion> questions = new ArrayList<>();

    @Override
    public String getUrl() {
        return "";
    }

    @Override
    public String getQuestion() {
        return null;
    }

    public void setQuestions(List<SurveyQuestion> questions) {
        this.questions = questions;
        if (questions != null) {
            for (SurveyQuestion q : questions) {
                q.setSurvey(this);
            }
        }
    }

    public void setSection(Section section) {
        super.setSection(section);
    }
}