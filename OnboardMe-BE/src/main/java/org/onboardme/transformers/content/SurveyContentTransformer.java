package org.onboardme.transformers.content;

import com.onboardme.model.SurveyContentDTO;
import com.onboardme.model.SurveyOptionDTO;
import com.onboardme.model.SurveyQuestionDTO;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.SurveyContent;
import org.onboardme.dao.entities.content.SurveyOption;
import org.onboardme.dao.entities.content.SurveyQuestion;
import org.onboardme.dao.entities.content.QuestionType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SurveyContentTransformer implements ContentTransformer<SurveyContent, SurveyContentDTO> {
    @Override
    public Class<SurveyContent> getEntityClass() {
        return SurveyContent.class;
    }

    @Override
    public Class<SurveyContentDTO> getDtoClass() {
        return SurveyContentDTO.class;
    }
    @Override
    public SurveyContentDTO toDto(SurveyContent entity) {
        SurveyContentDTO dto = new SurveyContentDTO();
        dto.setType(SurveyContentDTO.TypeEnum.EXAM);
        dto.setContentId(entity.getId_content());
        dto.setSectionId(entity.getSection().getId());
        if (entity.getQuestions() != null) {
            dto.setQuestions(entity.getQuestions().stream().map(q -> {
                SurveyQuestionDTO qdto = new SurveyQuestionDTO();
                qdto.setId(q.getId());
                qdto.setText(q.getText());
                qdto.setType(SurveyQuestionDTO.TypeEnum.valueOf(q.getType().name()));
                if (q.getOptions() != null) {
                    qdto.setOptions(q.getOptions().stream().map(o -> {
                        SurveyOptionDTO odto = new SurveyOptionDTO();
                        odto.setId(o.getId());
                        odto.setText(o.getText());
                        return odto;
                    }).toList());
                }
                return qdto;
            }).toList());
        }
        return dto;
    }

    @Override
    public SurveyContent toEntity(SurveyContentDTO dto, Section section) {
        SurveyContent entity = new SurveyContent();
        entity.setSection(section);
        if (dto.getQuestions() != null) {
            List<SurveyQuestion> questions = dto.getQuestions().stream().map(qdto -> {
                SurveyQuestion q = new SurveyQuestion();
                q.setText(qdto.getText());
                q.setType(qdto.getType() != null
                        ? QuestionType.valueOf(qdto.getType().name())
                        : QuestionType.SINGLE_CHOICE);
                if (qdto.getOptions() != null) {
                    List<SurveyOption> options = qdto.getOptions().stream().map(odto -> {
                        SurveyOption o = new SurveyOption();
                        o.setText(odto.getText());
                        return o;
                    }).toList();
                    q.setOptions(options);
                }
                return q;
            }).toList();
            entity.setQuestions(questions);
        }
        return entity;
    }
}
