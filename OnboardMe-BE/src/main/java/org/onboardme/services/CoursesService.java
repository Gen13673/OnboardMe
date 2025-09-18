package org.onboardme.services;

import com.onboardme.model.*;
import jakarta.persistence.EntityNotFoundException;
import org.onboardme.dao.entities.*;
import org.onboardme.dao.repositories.*;
import org.onboardme.transformers.CourseTransformer;
import org.onboardme.transformers.EnrollmentTransformer;
import org.onboardme.transformers.SectionContentTransformer;
import org.onboardme.transformers.SectionTransformer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Date;

@Service
public class CoursesService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    EnrollmentRepository enrollmentRepository;

    @Autowired
    CourseTransformer courseTransformer;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    SectionTransformer sectionTransformer;

    @Autowired
    SectionRepository sectionRepository;

    @Autowired
    EnrollmentTransformer enrollmentTransformer;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<CourseDTO> getCourses() {
        List<Course> courses = courseRepository.findAll();
        return courses.stream().map(courseTransformer::buildCourseResponse).toList();
    }

    public List<CourseDTO> getCoursesByUser(Long userId) {

        Optional<User> user = userRepository.findById(userId);

        List<Course> courses = user.get().getEnrollments().stream()
                .map(Enrollment::getCourse)
                .distinct()
                .toList();

        return courses.stream().map(course -> courseTransformer.buildCourseResponse(course)).toList();
    }

    public CourseDTO getCourseById(Long idCourse) {
        Course course = courseRepository.findById(Math.toIntExact(idCourse))
                .orElseThrow(() -> new EntityNotFoundException("Curso no encontrado con ID: " + idCourse));

        return courseTransformer.buildCourseResponse(course);
    }

    public ResponseEntity<Void> favCourse(Long idCourse, Long idUser) {

        Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByUserIdAndCourseId(idUser, idCourse);

        if (enrollmentOpt.isPresent()) {
            Enrollment enrollment = enrollmentOpt.get();
            enrollment.setFavorite(!Boolean.TRUE.equals(enrollment.getFavorite()));// Cambia true a false y viceversa
            enrollmentRepository.save(enrollment);
        }

        return ResponseEntity.ok().build();
    }

    public List<CourseDTO> getFavorites(Long userId) {

        List<Enrollment> enrollments = enrollmentRepository.findByUserIdAndFavoriteTrue(userId);

        List<Course> courses = enrollments.stream()
                .map(Enrollment::getCourse)
                .distinct()
                .toList();

        return courses.stream()
                .map(courseTransformer::buildCourseResponse)
                .toList();
    }

    public CourseDTO createCourse(CourseDTO dto) {
        Long creatorId = dto.getCreatedBy().getId();
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + creatorId));

        Course course = courseTransformer.buildCourseEntity(dto, creator);

        List<Section> sectionEntities = sectionTransformer.buildSectionEntities(dto.getSections(), course);
        course.setSections(sectionEntities);

        Course saved = courseRepository.save(course);

        return courseTransformer.buildCourseResponse(saved);
    }

    public void updateCourseProgress(Long courseId, Long userId, Long sectionId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Inscripción no encontrada"));

        Section newSection = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new EntityNotFoundException("Sección no encontrada"));

        if (!newSection.getCourse().getId().equals(courseId)) {
            throw new IllegalArgumentException("La sección no pertenece al curso");
        }

        Section currentSection = enrollment.getSection();

        if (currentSection != null && newSection.getId() <= currentSection.getId()) {
            return;
        }

        enrollment.setSection(newSection);

        // Verifico si la nueva sección es la última del curso para setear la fecha de finalización y el estado FINALIZADO
        List<Section> sections = enrollment.getCourse().getSections();
        Long maxId = sections.stream()
                .map(Section::getId)
                .max(Long::compareTo)
                .orElse(null);

        if (newSection.getId().equals(maxId) && enrollment.getFinishedDate() == null) {
            enrollment.setFinishedDate(new Date());
            enrollment.setStatus("FINALIZADO");

            Course course = courseRepository.findById(courseId);
            User usuarioQueFinalizo = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + userId));
            User usuarioANotificar = usuarioQueFinalizo.getBuddy();
            if(usuarioANotificar == null){
                return;
            }else{
                //Envío notificación al buddy
                Notification notification = new Notification();
                notification.setUser(usuarioANotificar);
                notification.setTitle("CURSO FINALIZADO");
                notification.setMessage("Hola, " + usuarioANotificar.getFirstName() + " " + usuarioANotificar.getLastName() +
                        " te informamos que el usuario " + usuarioQueFinalizo.getFirstName() + " " + usuarioQueFinalizo.getLastName() +
                        " ha finalizado el curso: " + course.getTitle());
                notification.setSentDate(new Date());
                notification.setSeen(false);

                notificationRepository.save(notification);
            }
        }

        enrollmentRepository.save(enrollment);
    }

    public Double getCourseProgress(Long courseId, Long userId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Inscripción no encontrada"));

        Course course = enrollment.getCourse();
        List<Section> sections = course.getSections();
        sections.sort(Comparator.comparingInt(a -> Integer.parseInt(a.getOrder())));

        int total = sections.size();
        int lastIndex = 0;
        if (enrollment.getSection() != null) {
            lastIndex = Integer.parseInt(enrollment.getSection().getOrder());
        }

        return total > 0 ? Math.ceil((lastIndex * 1000.0) / total) / 10.0 : 0.0;

    }

    public void assignCourse(Long courseId, Long buddyId, Long userId) {
        User buddy = userRepository.findById(buddyId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + buddyId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + userId));

        if (user.getBuddy() == null || !user.getBuddy().getId().equals(buddy.getId())) {
            throw new IllegalArgumentException("Buddy no asignado a este usuario");
        }

        Course course = courseRepository.findById(Math.toIntExact(courseId))
                .orElseThrow(() -> new EntityNotFoundException("Curso no encontrado con ID: " + courseId));

        if (enrollmentRepository.findByUserIdAndCourseId(userId, courseId).isPresent()) {
            return;
        }

        Enrollment enrollment = new Enrollment(new EnrollmentId(userId, courseId), user, course, new Date(), null, "ASIGNADO", false, null);
        enrollmentRepository.save(enrollment);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("CURSO ASIGNADO");
        notification.setMessage("Hola, " + user.getFirstName() + " " + user.getLastName() + " se te ha asignado un nuevo curso: " + course.getTitle());
        notification.setSentDate(new Date());
        notification.setSeen(false);

        notificationRepository.save(notification);
    }

    public EnrollmentDTO getEnrollment(Long courseId, Long userId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new EntityNotFoundException("Inscripción no encontrada"));
        return enrollmentTransformer.buildEnrollmentResponse(enrollment);
    }

}
