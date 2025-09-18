package org.onboardme.transformers.content;

import com.onboardme.model.DocumentContentDTO;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.DocumentContent;
import org.springframework.stereotype.Component;

@Component
public class DocumentContentTransformer implements ContentTransformer<DocumentContent, DocumentContentDTO> {
    @Override
    public Class<DocumentContent> getEntityClass() {
        return DocumentContent.class;
    }

    @Override
    public Class<DocumentContentDTO> getDtoClass() {
        return DocumentContentDTO.class;
    }
    @Override
    public DocumentContentDTO toDto(DocumentContent entity) {
        DocumentContentDTO dto = new DocumentContentDTO();
        dto.setType(DocumentContentDTO.TypeEnum.DOCUMENT);
        dto.setContentId(entity.getId_content());
        dto.setSectionId(entity.getSection().getId());
        dto.setUrl(entity.getUrl());
        return dto;
    }

    @Override
    public DocumentContent toEntity(DocumentContentDTO dto, Section section) {
        DocumentContent entity = new DocumentContent();
        entity.setSection(section);
        entity.setUrl(dto.getUrl());
        return entity;
    }
}