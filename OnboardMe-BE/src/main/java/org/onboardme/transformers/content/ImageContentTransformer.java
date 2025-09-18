package org.onboardme.transformers.content;

import com.onboardme.model.ImageContentDTO;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.ImageContent;
import org.springframework.stereotype.Component;

@Component
public class ImageContentTransformer implements ContentTransformer<ImageContent, ImageContentDTO> {
    @Override
    public Class<ImageContent> getEntityClass() {
        return ImageContent.class;
    }

    @Override
    public Class<ImageContentDTO> getDtoClass() {
        return ImageContentDTO.class;
    }
    @Override
    public ImageContentDTO toDto(ImageContent entity) {
        ImageContentDTO dto = new ImageContentDTO();
        dto.setType(ImageContentDTO.TypeEnum.IMAGE);
        dto.setContentId(entity.getId_content());
        dto.setSectionId(entity.getSection().getId());
        dto.setUrl(entity.getUrl());
        return dto;
    }

    @Override
    public ImageContent toEntity(ImageContentDTO dto, Section section) {
        ImageContent entity = new ImageContent();
        entity.setSection(section);
        entity.setUrl(dto.getUrl());
        return entity;
    }
}