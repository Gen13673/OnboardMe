package org.onboardme.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardme.model.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.*;
import org.onboardme.dao.repositories.ExamResultRepository;
import org.onboardme.dao.repositories.SectionRepository;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final ExamResultRepository examResultRepository;
    private final CoursesService coursesService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ExamResultDTO submitExam(Long sectionId, Long userId, ExamSubmissionDTO submission) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("Sección no encontrada"));

        if (!(section.getContent() instanceof ExamContent exam)) {
            throw new IllegalArgumentException("La sección no posee examen");
        }

        examResultRepository.findByUserAndExam(userId, exam.getId_content()).ifPresent(r -> {
            throw new IllegalStateException("El examen ya fue completado");
        });

        Map<Long, List<Long>> answersMap = new HashMap<>();
        if (submission.getAnswers() != null) {
            for (ExamAnswerDTO a : submission.getAnswers()) {
                answersMap.put(a.getQuestionId(), a.getSelectedOptionIds());
            }
        }

        List<ExamQuestionResultDTO> questionResults = new ArrayList<>();
        int score = 0;
        for (ExamQuestion question : exam.getQuestions()) {
            List<Long> selected = answersMap.getOrDefault(question.getId(), List.of());
            List<Long> correctOptionIds = question.getOptions().stream()
                    .filter(o -> Boolean.TRUE.equals(o.getCorrect()))
                    .map(ExamOption::getId)
                    .toList();
            boolean correct = new HashSet<>(selected).equals(new HashSet<>(correctOptionIds));
            if (correct) {
                score++;
            }
            ExamQuestionResultDTO qr = new ExamQuestionResultDTO();
            qr.setQuestionId(question.getId());
            qr.setSelectedOptionIds(selected);
            qr.setCorrectOptionIds(correctOptionIds);
            qr.setCorrect(correct);
            questionResults.add(qr);
        }

        ExamResult result = new ExamResult();
        result.setExam(exam);
        result.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado")));
        result.setScore(score);
        result.setTotalQuestions(exam.getQuestions().size());
        result.setCompletedAt(new Date());
        try {
            result.setDetail(objectMapper.writeValueAsString(questionResults));
        } catch (IOException e) {
            throw new RuntimeException("Error serializando resultados", e);
        }

        examResultRepository.save(result);

        coursesService.updateCourseProgress(section.getCourse().getId(), userId, sectionId);

        ExamResultDTO dto = new ExamResultDTO();
        dto.setScore(score);
        dto.setTotalQuestions(exam.getQuestions().size());
        dto.setResults(questionResults);
        return dto;
    }

    public ExamResultDTO getExamResult(Long sectionId, Long userId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("Sección no encontrada"));

        if (!(section.getContent() instanceof ExamContent exam)) {
            throw new IllegalArgumentException("La sección no posee examen");
        }

        ExamResult result = examResultRepository.findByUserAndExam(userId, exam.getId_content())
                .orElseThrow(() -> new EntityNotFoundException("Resultado no encontrado"));

        List<ExamQuestionResultDTO> questionResults;
        try {
            questionResults = objectMapper.readValue(result.getDetail(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new RuntimeException("Error deserializando resultados", e);
        }

        ExamResultDTO dto = new ExamResultDTO();
        dto.setScore(result.getScore());
        dto.setTotalQuestions(result.getTotalQuestions());
        dto.setResults(questionResults);
        return dto;
    }
}