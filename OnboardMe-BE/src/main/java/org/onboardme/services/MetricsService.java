package org.onboardme.services;

import com.onboardme.model.DataPointDTO;
import com.onboardme.model.GenericMetricDTO;
import com.onboardme.model.MetricTypeDTO;
import org.onboardme.dao.entities.Course;
import org.onboardme.dao.entities.Enrollment;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.entities.Section;
import org.onboardme.dao.entities.content.ExamContent;
import org.onboardme.dao.entities.content.ExamResult;
import org.onboardme.dao.repositories.ExamResultRepository;
import org.onboardme.dao.repositories.EnrollmentRepository;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.onboardme.dao.entities.content.SurveyContent;
import org.onboardme.dao.repositories.SurveyResultRepository;
import com.onboardme.model.SurveyQuestionResultDTO;

import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MetricsService {

    private final EnrollmentRepository enrollmentRepo;
    private final UserRepository userRepo;
    private final CoursesService coursesService;
    private final ExamResultRepository examResultRepository;
    private final SurveyResultRepository surveyResultRepository;

    public MetricsService(EnrollmentRepository enrollmentRepo,
                          UserRepository userRepo,
                          CoursesService coursesService,
                          ExamResultRepository examResultRepository,
                          SurveyResultRepository surveyResultRepository) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.coursesService = coursesService;
        this.examResultRepository = examResultRepository;
        this.surveyResultRepository = surveyResultRepository;
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

            case EXAM_RESULTS -> {
                if (idCourse == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idCourse es obligatorio para EXAM_RESULTS");
                }

                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idCourse, idBuddy);
                if (enrollments == null || enrollments.isEmpty()) {
                    return new GenericMetricDTO()
                            .metricType(type.name())
                            .data(java.util.List.of());
                }

                // Tomamos el curso de cualquiera de los enrollments
                Course course = enrollments.get(0).getCourse();
                if (course == null || course.getSections() == null || course.getSections().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "El curso no tiene secciones");
                }

                // Buscar la primera sección con contenido de EXAM
                ExamContent examContent = null;
                for (Section s : course.getSections()) {
                    if (s.getContent() instanceof ExamContent ec) {
                        examContent = ec;
                        break;
                    }
                }
                if (examContent == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "El curso no tiene una sección de examen");
                }

                long pending = 0L;
                long passed  = 0L;
                long failed  = 0L;

                points = new java.util.ArrayList<>();

                for (Enrollment e : enrollments) {
                    User u = e.getUser();
                    if (u == null) continue;

                    var opt = examResultRepository.findByUserAndExam(u.getId(), examContent.getId_content());
                    if (opt.isEmpty()) {
                        pending++;
                        points.add(new DataPointDTO()
                                .label("ROW|" + course.getId() + "|" + esc(course.getTitle()) + "|"
                                        + u.getId() + "|" + esc(fullNameOf(u)) + "|PENDING|0|0")
                                .value(java.math.BigDecimal.ZERO));
                        continue;
                    }

                    var r = opt.get();
                    int score = r.getScore() == null ? 0 : r.getScore();
                    int total = r.getTotalQuestions() == null ? 0 : r.getTotalQuestions();

                    // Aprobado = 50% o más del 50% de aciertos
                    boolean isPassed = (total > 0) && ((score * 2) >= total);

                    if (isPassed) passed++; else failed++;

                    double pct = (total > 0) ? (score * 100.0 / total) : 0.0;

                    points.add(new DataPointDTO()
                            .label("ROW|" + course.getId() + "|" + esc(course.getTitle()) + "|"
                                    + u.getId() + "|" + esc(fullNameOf(u)) + "|"
                                    + (isPassed ? "PASSED" : "FAILED") + "|"
                                    + score + "|" + total)
                            .value(java.math.BigDecimal.valueOf(Math.round(pct))));
                }

                // Totales para los "cards" (orden: pendientes, aprobados, desaprobados)
                points.add(new DataPointDTO().label("SUMMARY_PENDING").value(java.math.BigDecimal.valueOf(pending)));
                points.add(new DataPointDTO().label("SUMMARY_PASSED").value(java.math.BigDecimal.valueOf(passed)));
                points.add(new DataPointDTO().label("SUMMARY_FAILED").value(java.math.BigDecimal.valueOf(failed)));
            }

            case SURVEY_FEEDBACK -> {
                if (idCourse == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "idCourse es obligatorio para SURVEY_FEEDBACK");
                }

                var enrollments = enrollmentRepo.findByCourseAndOptionalBuddy(idCourse, idBuddy);
                if (enrollments == null || enrollments.isEmpty()) {
                    return new GenericMetricDTO().metricType(type.name()).data(java.util.List.of());
                }

                Course course = enrollments.get(0).getCourse();
                if (course == null || course.getSections() == null || course.getSections().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El curso no tiene secciones");
                }

                SurveyContent surveyContent = null;
                for (Section s : course.getSections()) {
                    if (s.getContent() instanceof SurveyContent sc) { surveyContent = sc; break; }
                }
                if (surveyContent == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "El curso seleccionado no tiene una sección de SURVEY");
                }

                var questions = surveyContent.getQuestions();
                if (questions == null || questions.isEmpty()) {
                    return new GenericMetricDTO().metricType(type.name()).data(java.util.List.of());
                }

                final int lastIdx = questions.size() - 1; // última = satisfacción con Buddy
                var lastQ = questions.get(lastIdx);

                record Agg(double sum, int count) {}
                Map<Long, Agg> qAgg = new HashMap<>(); // questionId -> (sum, count)

                double buddyCourseSum = 0.0;
                int buddyCourseCnt = 0;

                ObjectMapper om = new ObjectMapper();

                for (Enrollment e : enrollments) {
                    var u = e.getUser();
                    if (u == null) continue;

                    var optRes = surveyResultRepository.findByUserAndSurvey(u.getId(), surveyContent.getId_content());
                    if (optRes.isEmpty()) continue;

                    var res = optRes.get();
                    List<SurveyQuestionResultDTO> qResults;
                    try {
                        qResults = om.readValue(res.getDetail(), new TypeReference<>() {});
                    } catch (Exception ex) { continue; }
                    if (qResults == null) continue;

                    // calculamos score "por usuario" para cada pregunta respondida
                    for (int i = 0; i < questions.size(); i++) {
                        var q = questions.get(i);
                        Long qId = q.getId();
                        if (qId == null) continue;

                        var qr = qResults.stream()
                                .filter(it -> Objects.equals(it.getQuestionId(), qId))
                                .findFirst().orElse(null);
                        if (qr == null) continue;

                        var selected = qr.getSelectedOptionIds();
                        if (selected == null || selected.isEmpty()) continue;

                        // score del usuario en esta pregunta
                        double userScore = avgWeightForSelection(q, selected); // 0..100

                        if (i == lastIdx) {
                            buddyCourseSum += userScore;
                            buddyCourseCnt += 1;
                        } else {
                            var prev = qAgg.getOrDefault(qId, new Agg(0, 0));
                            qAgg.put(qId, new Agg(prev.sum() + userScore, prev.count() + 1));
                        }
                    }
                }

                List<DataPointDTO> out = new ArrayList<>();

                for (int i = 0; i < questions.size() - 1; i++) {
                    var q = questions.get(i);
                    var ag = qAgg.get(q.getId());
                    double pct = (ag != null && ag.count() > 0) ? (ag.sum() / ag.count()) : 0.0;
                    out.add(new DataPointDTO()
                            .label("QSCORE|" + (i + 1) + "|" + esc(q.getText()))
                            .value(BigDecimal.valueOf(Math.round(pct))));
                }

                if (idBuddy != null) {
                    var buddyOpt = userRepo.findById(idBuddy);
                    String buddyName = buddyOpt.map(this::fullNameOf).orElse("Buddy");

                    double buddyCoursePct = (buddyCourseCnt > 0) ? (buddyCourseSum / buddyCourseCnt) : 0.0;
                    out.add(new DataPointDTO()
                            .label("BUDDY_COURSE_SCORE|" + idBuddy + "|" + course.getId() + "|" + esc(course.getTitle()) + "|" + esc(buddyName))
                            .value(BigDecimal.valueOf(Math.round(buddyCoursePct))));

                    double buddyAllSum = 0.0;
                    int buddyAllCnt = 0;

                    var buddyEnrolls = enrollmentRepo.findByBuddy(idBuddy);
                    for (Enrollment e : buddyEnrolls) {
                        var c = e.getCourse();
                        if (c == null || c.getSections() == null) continue;

                        SurveyContent scOther = null;
                        for (Section s : c.getSections()) {
                            if (s.getContent() instanceof SurveyContent scx) { scOther = scx; break; }
                        }
                        if (scOther == null || scOther.getQuestions() == null || scOther.getQuestions().isEmpty()) continue;

                        var lastOtherQ = scOther.getQuestions().get(scOther.getQuestions().size() - 1);
                        var lastOtherQId = lastOtherQ.getId();

                        var u = e.getUser();
                        if (u == null) continue;

                        var optRes2 = surveyResultRepository.findByUserAndSurvey(u.getId(), scOther.getId_content());
                        if (optRes2.isEmpty()) continue;

                        var res2 = optRes2.get();
                        List<SurveyQuestionResultDTO> qResults2;
                        try {
                            qResults2 = om.readValue(res2.getDetail(), new TypeReference<>() {});
                        } catch (Exception ex) { continue; }
                        if (qResults2 == null) continue;

                        var qrLast = qResults2.stream()
                                .filter(it -> Objects.equals(it.getQuestionId(), lastOtherQId))
                                .findFirst().orElse(null);
                        if (qrLast == null) continue;

                        var sel = qrLast.getSelectedOptionIds();
                        if (sel == null || sel.isEmpty()) continue;

                        double userScore = avgWeightForSelection(lastOtherQ, sel);
                        buddyAllSum += userScore;
                        buddyAllCnt += 1;
                    }

                    double buddyAllPct = (buddyAllCnt > 0) ? (buddyAllSum / buddyAllCnt) : 0.0;
                    out.add(new DataPointDTO()
                            .label("BUDDY_ALL_SCORE|" + idBuddy + "|" + esc(buddyName))
                            .value(BigDecimal.valueOf(Math.round(buddyAllPct))));
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

    private String fullNameOf(User u) {
        String fn = (u.getFirstName() == null ? "" : u.getFirstName());
        String ln = (u.getLastName() == null ? "" : u.getLastName());
        return (fn + " " + ln).trim();
    }

    private double avgWeightForSelection(org.onboardme.dao.entities.content.SurveyQuestion q, List<Long> selectedOptionIds) {
        var opts = q.getOptions();
        if (opts == null || opts.isEmpty()) return 0.0;
        int n = opts.size();
        if (n == 1) return 100.0;

        Map<Long, Integer> indexById = new HashMap<>();
        for (int i = 0; i < n; i++) {
            indexById.put(opts.get(i).getId(), i);
        }

        double sum = 0.0;
        int cnt = 0;
        for (Long oid : selectedOptionIds) {
            Integer idx = indexById.get(oid);
            if (idx == null) continue;
            // peso lineal: 1ra opción = 100, última = 0
            double w = ((double)(n - 1 - idx) / (double)(n - 1)) * 100.0;
            sum += w;
            cnt++;
        }
        return (cnt > 0) ? (sum / cnt) : 0.0;
    }
}
