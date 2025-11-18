package org.onboardme.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardme.model.ExamAnswerDTO;
import com.onboardme.model.SurveyQuestionResultDTO;
import com.onboardme.model.SurveyResultDTO;
import com.onboardme.model.SurveySubmissionDTO;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.SurveyContent;
import org.onboardme.dao.entities.content.SurveyQuestion;
import org.onboardme.dao.entities.content.SurveyResult;
import org.onboardme.dao.repositories.SectionRepository;
import org.onboardme.dao.repositories.SurveyResultRepository;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final SurveyResultRepository surveyResultRepository;
    private final CoursesService coursesService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void submitSurvey(Long sectionId, Long userId, SurveySubmissionDTO submission) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("Sección no encontrada"));

        if (!(section.getContent() instanceof SurveyContent survey)) {
            throw new IllegalArgumentException("La sección no posee survey");
        }

        surveyResultRepository.findByUserAndSurvey(userId, survey.getId_content()).ifPresent(r -> {
            throw new IllegalStateException("El survey ya fue completado");
        });

        Map<Long, List<Long>> answersMap = new HashMap<>();
        if (submission.getAnswers() != null) {
            for (ExamAnswerDTO a : submission.getAnswers()) {
                answersMap.put(a.getQuestionId(), a.getSelectedOptionIds());
            }
        }

        List<SurveyQuestionResultDTO> questionResults = new ArrayList<>();
        for (SurveyQuestion question : survey.getQuestions()) {
            List<Long> selected = answersMap.getOrDefault(question.getId(), List.of());
            SurveyQuestionResultDTO qr = new SurveyQuestionResultDTO();
            qr.setQuestionId(question.getId());
            qr.setSelectedOptionIds(selected);
            questionResults.add(qr);
        }

        SurveyResult result = new SurveyResult();
        result.setSurvey(survey);
        result.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado")));
        result.setTotalQuestions(survey.getQuestions().size());
        result.setCompletedAt(new Date());
        try {
            result.setDetail(objectMapper.writeValueAsString(questionResults));
        } catch (IOException e) {
            throw new RuntimeException("Error serializando resultados", e);
        }

        surveyResultRepository.save(result);

        coursesService.updateCourseProgress(section.getCourse().getId(), userId, sectionId);
    }

    public SurveyResultDTO getSurveyResult(Long sectionId, Long userId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("Sección no encontrada"));

        if (!(section.getContent() instanceof SurveyContent survey)) {
            throw new IllegalArgumentException("La sección no posee surveyen");
        }

        SurveyResult result = surveyResultRepository.findByUserAndSurvey(userId, survey.getId_content())
                .orElseThrow(() -> new EntityNotFoundException("Resultado no encontrado"));

        List<SurveyQuestionResultDTO> questionResults;
        try {
            questionResults = objectMapper.readValue(result.getDetail(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new RuntimeException("Error deserializando resultados", e);
        }

        SurveyResultDTO dto = new SurveyResultDTO();
        dto.setTotalQuestions(result.getTotalQuestions());
        dto.setResults(questionResults);
        return dto;
    }
}