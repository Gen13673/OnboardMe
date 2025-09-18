package org.onboardme.transformers.content;

import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;
import com.onboardme.model.SectionContentDTO;

public interface ContentTransformer<E extends SectionContent, D extends SectionContentDTO> {
    Class<E> getEntityClass();
    Class<D> getDtoClass();
    D toDto(E entity);
    E toEntity(D dto, Section section);
}