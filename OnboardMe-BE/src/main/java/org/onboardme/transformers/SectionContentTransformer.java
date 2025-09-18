package org.onboardme.transformers;

import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.SectionContent;
import com.onboardme.model.*;
import org.onboardme.transformers.content.ContentTransformer;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class SectionContentTransformer {

    private final Map<Class<?>, ContentTransformer<?, ?>> byEntity = new HashMap<>();
    private final Map<Class<?>, ContentTransformer<?, ?>> byDto = new HashMap<>();

    public SectionContentTransformer(List<ContentTransformer<?, ?>> transformers) {
        for (ContentTransformer<?, ?> t : transformers) {
            byEntity.put(t.getEntityClass(), t);
            byDto.put(t.getDtoClass(), t);
        }
    }
    @SuppressWarnings("unchecked")
    public SectionContentDTO buildSectionContentResponse(SectionContent content) {

        ContentTransformer<?, ?> raw = byEntity.get(content.getClass());
        if (raw == null) {
            throw new IllegalArgumentException("Tipo de contenido desconocido: " + content.getClass());
        }

        ContentTransformer<SectionContent, SectionContentDTO> transformer =
                (ContentTransformer<SectionContent, SectionContentDTO>) raw;
        return transformer.toDto(content);
    }
    @SuppressWarnings("unchecked")
    public SectionContent toEntity(SectionContentDTO dto, Section section) {

        ContentTransformer<?, ?> raw = byDto.get(dto.getClass());
        if (raw == null) {
            throw new IllegalArgumentException("Tipo de DTO desconocido: " + dto.getClass());
        }

        ContentTransformer<SectionContent, SectionContentDTO> transformer =
                (ContentTransformer<SectionContent, SectionContentDTO>) raw;
        return transformer.toEntity(dto, section);
    }
}
