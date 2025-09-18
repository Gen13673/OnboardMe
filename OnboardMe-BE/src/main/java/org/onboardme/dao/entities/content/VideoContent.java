package org.onboardme.dao.entities.content;

import org.onboardme.dao.entities.SectionContent;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "video_content")
public class VideoContent extends SectionContent {

    private String url;

    @Override
    public String getUrl() {
        return url;
    }

    @Override
    public String getQuestion() {
        return "";
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
