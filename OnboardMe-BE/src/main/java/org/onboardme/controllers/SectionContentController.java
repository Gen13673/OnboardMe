package org.onboardme.controllers;

import com.onboardme.api.SectionsApi;
import com.onboardme.model.*;
import org.onboardme.services.SectionContentService;
import org.onboardme.services.ExamService;
import org.onboardme.transformers.SectionContentTransformer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SectionContentController implements SectionsApi {

    private final SectionContentService sectionContentService;
    private final SectionContentTransformer sectionContentTransformer;
    private final ExamService examService;

    public SectionContentController(SectionContentService sectionContentService,
                                    SectionContentTransformer sectionContentTransformer,
                                    ExamService examService) {
        this.sectionContentService = sectionContentService;
        this.sectionContentTransformer = sectionContentTransformer;
        this.examService = examService;
    }

    @Override
    public ResponseEntity<Void> addVideoContent(Long sectionId, String url) {
        sectionContentService.addVideoContent(sectionId, url);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Void> addDocumentContent(Long sectionId, String url) {
        sectionContentService.addDocumentContent(sectionId, url);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Void> addImageContent(Long sectionId, String url) {
        sectionContentService.addImageContent(sectionId, url);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Void> addExamContent(Long sectionId, ExamContentDTO examContentDTO) {
        sectionContentService.addExamContent(sectionId, examContentDTO);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<ExamResultDTO> submitExam(Long sectionId, Long idUser, ExamSubmissionDTO examSubmissionDTO) {
        var result = examService.submitExam(sectionId, idUser, examSubmissionDTO);
        return ResponseEntity.ok(result);
    }

    @Override
    public ResponseEntity<ExamResultDTO> getExamResult(Long sectionId, Long idUser) {
        var result = examService.getExamResult(sectionId, idUser);
        return ResponseEntity.ok(result);
    }

    @Override
    public ResponseEntity<SectionContentDTO> getSectionContent(Long sectionId) {
        var content = sectionContentService.getContentBySection(sectionId);
        var response = sectionContentTransformer.buildSectionContentResponse(content);
        return ResponseEntity.ok(response);
    }
}
