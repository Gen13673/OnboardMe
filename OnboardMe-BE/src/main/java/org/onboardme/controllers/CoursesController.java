package org.onboardme.controllers;

import com.onboardme.api.CoursesApi;
import com.onboardme.model.CourseDTO;
import com.onboardme.model.EnrollmentDTO;
import org.onboardme.services.CoursesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CoursesController implements CoursesApi {

    @Autowired
    CoursesService coursesService;

    @Override
    public ResponseEntity<List<CourseDTO>> getCourses() {
        return ResponseEntity.ok(coursesService.getCourses());
    }

    @Override
    public ResponseEntity<List<CourseDTO>> getCoursesByUser(Long idLegajo) {

        return ResponseEntity.ok(coursesService.getCoursesByUser(idLegajo));
    }

    @Override
    public ResponseEntity<CourseDTO> getCourseById(Long idCourse) {
        return ResponseEntity.ok(coursesService.getCourseById(idCourse));
    }

    @Override
    public ResponseEntity<Void> favCourse(Long idCourse, Long idUser) {
        return coursesService.favCourse(idCourse, idUser);
    }

    @Override
    public ResponseEntity<List<CourseDTO>> getFavorites(Long userId) {
        return ResponseEntity.ok(coursesService.getFavorites(userId));
    }

    @Override
    public ResponseEntity<CourseDTO> createCourse(CourseDTO courseDTO) {
        CourseDTO created = coursesService.createCourse(courseDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }


    @Override
    public ResponseEntity<Void> updateCourseProgress(Long idCourse, Long idUser, Long sectionId) {
        coursesService.updateCourseProgress(idCourse, idUser, sectionId);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Double> getCourseProgress(Long idCourse, Long idUser) {
        Double progress = coursesService.getCourseProgress(idCourse, idUser);
        return ResponseEntity.ok(progress);
    }

    @Override
    public ResponseEntity<Void> assignCourse(Long idCourse, Long idBuddy, Long idUser) {
        coursesService.assignCourse(idCourse, idBuddy, idUser);
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<EnrollmentDTO> getEnrollment(Long idCourse, Long idUser) {
        EnrollmentDTO enrollment = coursesService.getEnrollment(idCourse, idUser);
        return ResponseEntity.ok(enrollment);
    }


}
