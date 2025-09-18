package org.onboardme.dao.entities;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "section_content")
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = org.onboardme.dao.entities.content.VideoContent.class, name = "VIDEO"),
        @JsonSubTypes.Type(value = org.onboardme.dao.entities.content.DocumentContent.class, name = "DOCUMENT"),
        @JsonSubTypes.Type(value = org.onboardme.dao.entities.content.ImageContent.class, name = "IMAGE"),
        @JsonSubTypes.Type(value = org.onboardme.dao.entities.content.ExamContent.class, name = "EXAM")
})
public abstract class SectionContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_content;

    @OneToOne
    @JoinColumn(name = "id_section")
    private Section section;

    public abstract String getUrl();

    public abstract String getQuestion();
}
