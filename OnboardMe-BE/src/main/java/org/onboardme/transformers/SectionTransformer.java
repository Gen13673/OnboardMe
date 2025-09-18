package org.onboardme.transformers;

import com.onboardme.model.*;
import org.onboardme.dao.entities.Course;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SectionTransformer {

    private final SectionContentTransformer sectionContentTransformer;

    public SectionTransformer(SectionContentTransformer sectionContentTransformer) {
        this.sectionContentTransformer = sectionContentTransformer;
    }

    public SectionDTO buildSectionResponse(Section section) {
        SectionDTO dto = new SectionDTO();
        dto.setId(section.getId());
        dto.setTitle(section.getTitle());
        dto.setOrder(section.getOrder());
        dto.setIdCourse(section.getCourse() != null ? section.getCourse().getId() : null);

        if (section.getContent() != null) {
            dto.setContent(sectionContentTransformer.buildSectionContentResponse(section.getContent()));
        }

        return dto;
    }

    public List<Section> buildSectionEntities(List<SectionDTO> sectionDTOs, Course course) {
        return sectionDTOs.stream()
                .map(sectionDTO -> {
                    Section section = new Section();
                    section.setTitle(sectionDTO.getTitle());
                    section.setOrder(sectionDTO.getOrder());
                    section.setCourse(course);

                    if (sectionDTO.getContent() != null) {
                        SectionContent content = sectionContentTransformer.toEntity(sectionDTO.getContent(), section);
                        section.setContent(content);
                    }

                    return section;
                })
                .toList();
    }

}
