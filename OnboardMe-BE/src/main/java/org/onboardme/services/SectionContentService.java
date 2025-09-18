package org.onboardme.services;

import lombok.RequiredArgsConstructor;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;
import org.onboardme.dao.entities.content.DocumentContent;
import org.onboardme.dao.entities.content.ExamContent;
import com.onboardme.model.ExamContentDTO;
import org.onboardme.transformers.content.ExamContentTransformer;
import org.onboardme.dao.entities.content.ImageContent;
import org.onboardme.dao.entities.content.VideoContent;
import org.onboardme.dao.repositories.SectionContentRepository;
import org.onboardme.dao.repositories.SectionRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SectionContentService {

    private final SectionRepository sectionRepository;
    private final SectionContentRepository contentRepository;
    private final ExamContentTransformer examContentTransformer;

    public SectionContent getContentBySection(Long sectionId) {
        return getSectionOrThrow(sectionId).getContent();
    }

    public void addVideoContent(Long sectionId, String url) {
        VideoContent video = new VideoContent();
        video.setUrl(url);
        video.setSection(getSectionOrThrow(sectionId));
        contentRepository.save(video);
    }

    public void addDocumentContent(Long sectionId, String url) {
        DocumentContent doc = new DocumentContent();
        doc.setUrl(url);
        doc.setSection(getSectionOrThrow(sectionId));
        contentRepository.save(doc);
    }

    public void addImageContent(Long sectionId, String url) {
        ImageContent img = new ImageContent();
        img.setUrl(url);
        img.setSection(getSectionOrThrow(sectionId));
        contentRepository.save(img);
    }

    public void addExamContent(Long sectionId, ExamContentDTO dto) {
        ExamContent exam = examContentTransformer.toEntity(dto, getSectionOrThrow(sectionId));
        contentRepository.save(exam);
    }

    private Section getSectionOrThrow(Long sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada con id: " + sectionId));
    }


}
