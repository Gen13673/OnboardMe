package org.onboardme.services;

import com.onboardme.model.DataPointDTO;
import com.onboardme.model.GenericMetricDTO;
import com.onboardme.model.MetricTypeDTO;
import org.onboardme.dao.entities.Course;
import org.onboardme.dao.entities.Enrollment;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.repositories.EnrollmentRepository;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MetricsService {

    private final EnrollmentRepository enrollmentRepo;
    private final UserRepository userRepo;
    private final CoursesService coursesService;

    public MetricsService(
            EnrollmentRepository enrollmentRepo,
            UserRepository userRepo,
            CoursesService coursesService
    ) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.coursesService = coursesService;
    }

    public GenericMetricDTO getMetric(MetricTypeDTO type, Long idBuddy, Long idCourse) {
        List<DataPointDTO> points;

        switch (type) {
            case COURSE_USER_PROGRESS -> {
                if (idCourse == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idUser (courseId) es obligatorio para COURSE_USER_PROGRESS");
                }
                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idCourse, idBuddy);

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
                if (idCourse == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idUser (courseId) es obligatorio para COURSE_USER_ELAPSED_DAYS");
                }
                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idCourse, idBuddy);
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

            case USER_COURSE_COMPLETION -> {
                List<User> users = (idBuddy != null)
                        ? userRepo.findByBuddyId(idBuddy)
                        : userRepo.findAll();

                users = users.stream().filter(Objects::nonNull).collect(Collectors.toList());

                class UItem {
                    long userId;
                    String fullName;
                    int completed;
                    int total;
                    double pct; // 0..100
                    List<Enrollment> enrollments;
                }

                List<UItem> items = new ArrayList<>();

                for (User u : users) {
                    List<Enrollment> enrolls = u.getEnrollments();
                    if (enrolls == null) enrolls = List.of();

                    int total = enrolls.size();
                    int completed = 0;

                    for (Enrollment e : enrolls) {
                        double p = 0.0;
                        try {
                            Course c = e.getCourse();
                            if (c != null) {
                                p = safeProgress(c.getId(), u.getId());
                            }
                        } catch (Exception ignore) {}
                        boolean done = isCompletedByRule(e, p);
                        if (done) completed++;
                    }

                    UItem it = new UItem();
                    it.userId = u.getId();
                    it.fullName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " " +
                            (u.getLastName() == null ? "" : u.getLastName())).trim();
                    it.total = total;
                    it.completed = completed;
                    it.pct = (total > 0) ? (completed * 100.0 / total) : 0.0;
                    it.enrollments = enrolls;

                    items.add(it);
                }

                items.sort(Comparator
                        .comparing((UItem x) -> x.completed == x.total ? 1 : 0)
                        .thenComparingDouble(x -> x.pct)
                        .thenComparing(x -> x.fullName == null ? "" : x.fullName.toLowerCase(Locale.ROOT)));

                int completedAll = (int) items.stream().filter(i -> i.total > 0 && i.completed == i.total).count();
                int notCompletedAll = (int) items.stream().filter(i -> i.total == 0 || i.completed < i.total).count();

                List<DataPointDTO> out = new ArrayList<>();
                out.add(new DataPointDTO().label("SUMMARY_COMPLETED_ALL").value(BigDecimal.valueOf(completedAll)));
                out.add(new DataPointDTO().label("SUMMARY_NOT_COMPLETED_ALL").value(BigDecimal.valueOf(notCompletedAll)));

                for (UItem it : items) {
                    out.add(new DataPointDTO()
                            .label("USER|" + it.userId + "|" + esc(it.fullName) + "|" + it.completed + "|" + it.total)
                            .value(BigDecimal.valueOf(Math.round(Math.max(0, Math.min(100, it.pct))))));

                    if (it.total == 0 || it.completed < it.total) {
                        for (Enrollment e : it.enrollments) {
                            double p = 0.0;
                            Course c = e.getCourse();
                            if (c == null) continue;
                            try { p = safeProgress(c.getId(), it.userId); } catch (Exception ignore) {}
                            if (!isCompletedByRule(e, p)) {
                                out.add(new DataPointDTO()
                                        .label("MISSING|" + it.userId + "|" + c.getId() + "|" + esc(c.getTitle()))
                                        .value(BigDecimal.valueOf(Math.round(Math.max(0, Math.min(100, p))))));
                            }
                        }
                    }
                }

                points = out;
            }

            default -> throw new IllegalArgumentException("Métrica no soportada: " + type);
        }

        return new GenericMetricDTO()
                .metricType(type.name())
                .data(points);
    }

    private boolean isCompletedByRule(Enrollment e, double courseProgressPct) {
        if (e.getFinishedDate() != null) return true;
        String status = e.getStatus();
        if (status != null && "COMPLETADO".equalsIgnoreCase(status.trim())) return true;
        return courseProgressPct >= 100.0;
    }

    private double safeProgress(Long courseId, Long userId) {
        try {
            Double v = coursesService.getCourseProgress(courseId, userId);
            return v == null ? 0.0 : v;
        } catch (EntityNotFoundException ex) {
            return 0.0;
        }
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("|", "¦");
    }
}
