package org.onboardme.transformers;

import com.onboardme.model.CourseDTO;
import com.onboardme.model.EnrollmentDTO;
import com.onboardme.model.SectionDTO;
import com.onboardme.model.UserDTO;
import org.onboardme.dao.entities.Course;
import org.onboardme.dao.entities.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CourseTransformer {

    @Autowired
    private UserTransformer userTransformer;

    @Autowired
    private SectionTransformer sectionTransformer;

    @Autowired
    private EnrollmentTransformer enrollmentTransformer;

    public CourseDTO buildCourseResponse(Course course) {
        UserDTO createdByDTO = userTransformer.buildUserResponse(course.getCreatedBy());

        List<SectionDTO> sectionDTOs = course.getSections().stream()
                .map(sectionTransformer::buildSectionResponse)
                .collect(Collectors.toList());

        List<EnrollmentDTO> enrollmentDTOS = course.getEnrollments().stream()
                .map(enrollmentTransformer::buildEnrollmentResponse)
                .collect(Collectors.toList());

        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setArea(course.getArea());
        dto.setCreatedDate(course.getCreatedDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        if (course.getExpiryDate() != null) {
            dto.setExpiryDate(course.getExpiryDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }
        dto.setCreatedBy(createdByDTO);
        dto.setSections(sectionDTOs);
        dto.setEnrollments(enrollmentDTOS);

        return dto;
    }

    public Course buildCourseEntity(CourseDTO dto, User createdBy) {
        Course course = new Course();
        course.setId(dto.getId());
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setArea(dto.getArea());

        if (dto.getCreatedDate() != null) {
            Date created = Date.from(dto.getCreatedDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
            course.setCreatedDate(created);
        }
        if (dto.getExpiryDate() != null) {
            Date finished = Date.from(dto.getExpiryDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
            course.setExpiryDate(finished);
        }

        course.setCreatedBy(createdBy);
        return course;
    }
}

