package org.onboardme.transformers.content;

import com.onboardme.model.VideoContentDTO;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.VideoContent;
import org.springframework.stereotype.Component;

@Component
public class VideoContentTransformer implements ContentTransformer<VideoContent, VideoContentDTO> {
    @Override
    public Class<VideoContent> getEntityClass() {
        return VideoContent.class;
    }

    @Override
    public Class<VideoContentDTO> getDtoClass() {
        return VideoContentDTO.class;
    }
    @Override
    public VideoContentDTO toDto(VideoContent entity) {
        VideoContentDTO dto = new VideoContentDTO();
        dto.setType(VideoContentDTO.TypeEnum.VIDEO);
        dto.setContentId(entity.getId_content());
        dto.setSectionId(entity.getSection().getId());
        dto.setUrl(entity.getUrl());
        return dto;
    }

    @Override
    public VideoContent toEntity(VideoContentDTO dto, Section section) {
        VideoContent entity = new VideoContent();
        entity.setSection(section);
        entity.setUrl(dto.getUrl());
        return entity;
    }
}