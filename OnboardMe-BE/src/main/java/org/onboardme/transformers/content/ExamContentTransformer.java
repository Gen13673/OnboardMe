package org.onboardme.transformers.content;

import com.onboardme.model.*;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExamContentTransformer implements ContentTransformer<ExamContent, ExamContentDTO> {
    @Override
    public Class<ExamContent> getEntityClass() {
        return ExamContent.class;
    }

    @Override
    public Class<ExamContentDTO> getDtoClass() {
        return ExamContentDTO.class;
    }
    @Override
    public ExamContentDTO toDto(ExamContent entity) {
        ExamContentDTO dto = new ExamContentDTO();
        dto.setType(ExamContentDTO.TypeEnum.EXAM);
        dto.setContentId(entity.getId_content());
        dto.setSectionId(entity.getSection().getId());
        dto.setTimeLimit(entity.getTimeLimit());
        if (entity.getQuestions() != null) {
            dto.setQuestions(entity.getQuestions().stream().map(q -> {
                ExamQuestionDTO qdto = new ExamQuestionDTO();
                qdto.setId(q.getId());
                qdto.setText(q.getText());
                qdto.setType(ExamQuestionDTO.TypeEnum.valueOf(q.getType().name()));
                if (q.getOptions() != null) {
                    qdto.setOptions(q.getOptions().stream().map(o -> {
                        ExamOptionDTO odto = new ExamOptionDTO();
                        odto.setId(o.getId());
                        odto.setText(o.getText());
                        odto.setCorrect(o.getCorrect());
                        return odto;
                    }).toList());
                }
                return qdto;
            }).toList());
        }
        return dto;
    }

    @Override
    public ExamContent toEntity(ExamContentDTO dto, Section section) {
        ExamContent entity = new ExamContent();
        entity.setSection(section);
        entity.setTimeLimit(dto.getTimeLimit());
        if (dto.getQuestions() != null) {
            List<ExamQuestion> questions = dto.getQuestions().stream().map(qdto -> {
                ExamQuestion q = new ExamQuestion();
                q.setText(qdto.getText());
                q.setType(qdto.getType() != null
                        ? QuestionType.valueOf(qdto.getType().name())
                        : QuestionType.SINGLE_CHOICE);
                if (qdto.getOptions() != null) {
                    List<ExamOption> options = qdto.getOptions().stream().map(odto -> {
                        ExamOption o = new ExamOption();
                        o.setText(odto.getText());
                        o.setCorrect(odto.getCorrect());
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
