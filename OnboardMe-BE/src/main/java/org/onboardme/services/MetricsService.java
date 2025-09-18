package org.onboardme.services;

import com.onboardme.model.DataPointDTO;
import com.onboardme.model.GenericMetricDTO;
import com.onboardme.model.MetricTypeDTO;
import org.onboardme.dao.repositories.CourseRepository;
import org.onboardme.dao.repositories.EnrollmentRepository;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.math.BigDecimal;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
public class MetricsService {

    private final CourseRepository     courseRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final UserRepository       userRepo;

    public MetricsService(CourseRepository courseRepo,
                          EnrollmentRepository enrollmentRepo,
                          UserRepository userRepo) {
        this.courseRepo     = courseRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo       = userRepo;
    }

    public GenericMetricDTO getMetric(MetricTypeDTO type, Long idBuddy, Long idUser) {
        List<DataPointDTO> points;

        // Reglas de obligatoriedad
        if (type == MetricTypeDTO.USER_PROGRESS && idUser == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "idUser es obligatorio para USER_PROGRESS");
        }

        // Modo especial: si piden AVG_COMPLETION_TIME y llega "courseId" reusando idUser,
        // devolvemos promedio POR USUARIO para ese curso (sin crear endpoint nuevo).
        if (type == MetricTypeDTO.AVG_COMPLETION_TIME && idUser != null) {
            Long courseId = idUser; // alias intencional para no cambiar la firma del override
            var rows = enrollmentRepo.findUserAvgCompletionTimeByCourseRaw(courseId, idBuddy);

            var pointsLocal = new ArrayList<DataPointDTO>();
            for (Object[] r : rows) {
                String name = (String) r[0];
                Number avg  = (Number) r[1];
                pointsLocal.add(new DataPointDTO()
                        .label(name)
                        .value(BigDecimal.valueOf(avg != null ? avg.doubleValue() : 0.0)));
            }

            return new GenericMetricDTO()
                    .metricType(type.name())
                    .data(pointsLocal);
        }

        switch (type) {
            case COURSE_COMPLETION ->
                    points = courseRepo.findCourseCompletionRatesByBuddy(idBuddy)
                            .stream()
                            .map(d -> new DataPointDTO()
                                    .label(d.getCourseTitle())
                                    .value(BigDecimal.valueOf(d.getCompletionRate())))
                            .collect(Collectors.toList());

            case AVG_COMPLETION_TIME ->
                    points = courseRepo.findAvgCompletionTimesByBuddy(idBuddy)
                            .stream()
                            .map(d -> new DataPointDTO()
                                    .label(d.getCourseTitle())
                                    .value(BigDecimal.valueOf(d.getAverageDays())))        // averageDays ya es BigDecimal
                            .collect(Collectors.toList());

            case SECTION_DROPOFF ->
                    points = enrollmentRepo.findSectionDropoffRatesByBuddy(idBuddy)
                            .stream()
                            .map(d -> new DataPointDTO()
                                    .label(d.getSectionTitle())
                                    .value(BigDecimal.valueOf(d.getDropoffRate())))
                            .collect(Collectors.toList());

            case BUDDY_COVERAGE -> {
                var bc = userRepo.findBuddyCoverage();
                points = List.of(
                        new DataPointDTO().label("Cobertura (%)")
                                .value(BigDecimal.valueOf(bc.getCoveragePercent())),
                        new DataPointDTO().label("Prom. Mentees")
                                .value(BigDecimal.valueOf(bc.getAverageMentees()))
                );
            }

            case USER_PROGRESS ->
                    points = enrollmentRepo.findCourseProgressByUser(idUser)
                            .stream()
                            .map(d -> new DataPointDTO()
                                    .label(d.getCourseTitle())
                                    .value(BigDecimal.valueOf(d.getProgressPercent())))
                            .collect(Collectors.toList());

            case COURSE_USER_PROGRESS -> {
                if (idUser == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idUser (courseId) es obligatorio para COURSE_USER_PROGRESS");
                }
                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idUser, idBuddy);

                // total de secciones del curso (para porcentajes)
                final long totalSections = Math.max(1L, enrollments.stream()
                        .findFirst()
                        .map(e -> (long) (e.getCourse() != null && e.getCourse().getSections() != null
                                ? e.getCourse().getSections().size()
                                : 0))
                        .orElse(0L));

                points = enrollments.stream().map(e -> {
                    double pct;
                    if (e.getFinishedDate() != null) {
                        pct = 100.0;
                    } else if (e.getSection() == null) {
                        pct = 0.0;
                    } else {
                        // 'order' es String: parseamos a int para calcular posición
                        int currentOrder = 0;
                        try { currentOrder = Integer.parseInt(e.getSection().getOrder()); } catch (Exception ignore) {}
                        pct = Math.max(0.0, Math.min(100.0, (currentOrder * 100.0) / totalSections));
                    }
                    String fullName = e.getUser().getFirstName() + " " + e.getUser().getLastName();
                    return new DataPointDTO()
                            .label(fullName)
                            .value(BigDecimal.valueOf(pct));
                }).collect(Collectors.toList());
            }

            case COURSE_USER_ELAPSED_DAYS -> {
                if (idUser == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idUser (courseId) es obligatorio para COURSE_USER_ELAPSED_DAYS");
                }
                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idUser, idBuddy);
                long now = System.currentTimeMillis();

                points = enrollments.stream().map(e -> {
                    Double days = null;
                    if (e.getEnrolledAt() != null) {
                        long end = (e.getFinishedDate() != null) ? e.getFinishedDate().getTime() : now;
                        long ms = Math.max(0L, end - e.getEnrolledAt().getTime());
                        days = ms / (1000.0 * 60 * 60 * 24);
                    }
                    String fullName = e.getUser().getFirstName() + " " + e.getUser().getLastName();
                    return new DataPointDTO()
                            .label(fullName)
                            .value(BigDecimal.valueOf(days != null ? days : 0.0));
                }).collect(Collectors.toList());
            }

            default -> throw new IllegalArgumentException("Métrica no soportada: " + type);
        }

        return new GenericMetricDTO()
                .metricType(type.name())
                .data(points);
    }
}
