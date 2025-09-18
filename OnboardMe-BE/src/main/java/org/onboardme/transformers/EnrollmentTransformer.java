package org.onboardme.transformers;

import com.onboardme.model.EnrollmentDTO;
import org.onboardme.dao.entities.Enrollment;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

@Component
public class EnrollmentTransformer {

    public EnrollmentDTO buildEnrollmentResponse(Enrollment enrollment) {
        EnrollmentDTO dto = new EnrollmentDTO();
        dto.setIdCourse(enrollment.getCourse().getId());
        dto.setIdUser(enrollment.getUser().getId());
        dto.setStatus(enrollment.getStatus());
        dto.setFavorite(enrollment.getFavorite());
        if (enrollment.getSection() != null) {
            dto.setIdSection(enrollment.getSection().getId());
        } else {
            dto.setIdSection(null);
        }


        if (enrollment.getEnrolledAt() != null) {
            dto.setEnrolledAt(enrollment.getEnrolledAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }

        return dto;
    }
}

