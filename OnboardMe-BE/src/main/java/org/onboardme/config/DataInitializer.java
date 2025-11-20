package org.onboardme.config;

import com.onboardme.model.SurveyQuestionResultDTO;
import jakarta.annotation.PostConstruct;
import org.onboardme.dao.entities.*;
import org.onboardme.dao.repositories.*;
import org.onboardme.services.PasswordService;
import org.springframework.context.annotation.Configuration;
import org.onboardme.dao.entities.content.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.onboardme.dao.repositories.ExamResultRepository;
import com.onboardme.model.ExamQuestionResultDTO;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ThreadLocalRandom;

import java.util.Date;
import java.util.List;

@Configuration
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SectionContentRepository sectionContentRepository;
    private final PasswordService passwordService;
    private final ExamResultRepository examResultRepository;
    private final ObjectMapper objectMapper;
    private final SurveyResultRepository surveyResultRepository;


    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           CourseRepository courseRepository,
                           SectionRepository sectionRepository,
                           EnrollmentRepository enrollmentRepository,
                           SectionContentRepository sectionContentRepository,
                           PasswordService passwordService,
                           ExamResultRepository examResultRepository,
                           SurveyResultRepository surveyResultRepository,
                           ObjectMapper objectMapper) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sectionContentRepository = sectionContentRepository;
        this.passwordService = passwordService;
        this.examResultRepository = examResultRepository;
        this.surveyResultRepository = surveyResultRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {

        final long DAY = 1000L * 60 * 60 * 24;
        // ---------- ROLES ----------
        Role admin = roleRepository.findByName("Admin")
                .orElseGet(() -> roleRepository.save(new Role(null, "Admin", null)));

        Role rrhh = roleRepository.findByName("RRHH")
                .orElseGet(() -> roleRepository.save(new Role(null, "RRHH", null)));

        Role buddy = roleRepository.findByName("Buddy")
                .orElseGet(() -> roleRepository.save(new Role(null, "Buddy", null)));

        Role empleado = roleRepository.findByName("Empleado")
                .orElseGet(() -> roleRepository.save(new Role(null, "Empleado", null)));

        // ---------- USUARIOS ----------
        Date fechaAlta = new Date();
        User buddyUser = userRepository.findByEmail("mauro.buddy@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Mauro", "López", "mauro.buddy@empresa.com", passwordService.hashPassword("buddy123"), "IT", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, buddy, null, null, null )));

        User buddyUser2 = userRepository.findByEmail("sofia.buddy@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Sofía", "Martínez", "sofia.buddy@empresa.com", passwordService.hashPassword("buddy123"), "IT", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, buddy, null, null, null)));

        User buddyUser3 = userRepository.findByEmail("lucia.buddy@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Lucía", "Diaz", "lucia.buddy@empresa.com", passwordService.hashPassword("buddy123"), "SEGURIDAD", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, buddy, null, null, null)));

        User employeeUser = userRepository.findByEmail("laura.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Laura", "Fernández", "laura.empleado@empresa.com", passwordService.hashPassword("buddy123"), "SOPORTE", fechaAlta, 1,"pepito 123", "556482256", fechaAlta,  empleado, null, null, buddyUser)));

        User employeeUser2 = userRepository.findByEmail("juan.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Juan", "Pérez", "juan.empleado@empresa.com", passwordService.hashPassword("empleado123"), "GERENCIA", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser2)));

        User employeeUser3 = userRepository.findByEmail("mariana.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Mariana", "Suárez", "mariana.empleado@empresa.com", passwordService.hashPassword("empleado123"), "GERENCIA", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser2)));

        User employeeUser4 = userRepository.findByEmail("carlos.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Carlos", "Ibarra", "carlos.empleado@empresa.com", passwordService.hashPassword("empleado123"), "IT", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser3)));

        User employeeUser5 = userRepository.findByEmail("emma.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Emma", "Torres", "emma.empleado@empresa.com", passwordService.hashPassword("empleado123"), "SEGURIDAD", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser3)));

        User adminUser = userRepository.findByEmail("carlos.admin@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Carlos", "Ramírez", "carlos.admin@empresa.com", passwordService.hashPassword("admin123"), "ADMINISTRATIVO", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, admin, null, null, buddyUser)));

        User adminUser2 = userRepository.findByEmail("maria.admin@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "María", "Núñez", "maria.admin@empresa.com", passwordService.hashPassword("admin123"), "ADMINISTRATIVO", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, admin, null, null, buddyUser3)));

        User rrhhUser = userRepository.findByEmail("ofasciolo@frba.utn.edu.ar")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Ornella", "Fasciolo", "ofasciolo@frba.utn.edu.ar", passwordService.hashPassword("rrhh123"), "RRHH", fechaAlta, 1, "pepito 123", "1156183224", fechaAlta, rrhh, null, null, buddyUser)));

        User rrhhUser2 = userRepository.findByEmail("diego.rrhh@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Diego", "López", "diego.rrhh@empresa.com", passwordService.hashPassword("rrhh123"), "RRHH", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, rrhh, null, null, buddyUser)));

        Date ahora = new Date();
        User buddyAlex = userRepository.findByEmail("gciruzzi@frba.utn.edu.ar").orElseGet(() ->
                userRepository.save(
                        new User(
                                null, "Genaro", "Ciruzzi", "gciruzzi@frba.utn.edu.ar", passwordService.hashPassword("buddy123"),
                                "IT", ahora, 1, "Av. Siempreviva 742", "1158864784", ahora,
                                buddy, null, null, null
                        )
                )
        );
        // ---- Para Mauro agregamos 4 más ----
        userRepository.findByEmail("andres.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Andrés", "Molina", "andres.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser)));

        userRepository.findByEmail("valentina.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Valentina", "Prieto", "valentina.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser)));

        userRepository.findByEmail("martin.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Martín", "Quiroga", "martin.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser)));

        userRepository.findByEmail("celeste.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Celeste", "Sosa", "celeste.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser)));

        userRepository.findByEmail("tomas.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Tomás", "Iglesias", "tomas.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser)));


        // ---- Para Sofía agregamos 4 más ----
        userRepository.findByEmail("agustina.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Agustina", "Vega", "agustina.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser2)));

        userRepository.findByEmail("pablo.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Pablo", "Rossi", "pablo.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser2)));

        userRepository.findByEmail("camila.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Camila", "Benítez", "camila.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser2)));

        userRepository.findByEmail("sebastian.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Sebastián", "Mansilla", "sebastian.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser2)));


        // ---- Para Lucía agregamos 4 más ----
        userRepository.findByEmail("bruno.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Bruno", "Luna", "bruno.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser3)));

        userRepository.findByEmail("malena.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Malena", "Paredes", "malena.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser3)));

        userRepository.findByEmail("ignacio.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Ignacio", "Serrano", "ignacio.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser3)));

        userRepository.findByEmail("florencia.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Florencia", "Maidana", "florencia.empleado@empresa.com",
                                passwordService.hashPassword("empleado123"),
                                "IT", fechaAlta, 1, "Direccion 123", "1152423356", fechaAlta,
                                empleado, null, null, buddyUser3)));

        // ---------- CURSOS ----------
        Date dentroDeUnMes = new Date(ahora.getTime() + (1000L * 60 * 60 * 24 * 30));
        Date dentroDeQuincena = new Date(ahora.getTime() + (1000L * 60 * 60 * 24 * 15));
        LocalDate localDateAyer = LocalDate.now().minusDays(1);
        Date ayer = Date.from(localDateAyer.atStartOfDay(ZoneId.systemDefault()).toInstant());

        LocalDate localDateManana = LocalDate.now().plusDays(1);
        Date manana = Date.from(localDateManana.atStartOfDay(ZoneId.systemDefault()).toInstant());


        Course cursoInicial = courseRepository.findByTitle("Curso Inicial")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Curso Inicial", "Curso básico de introducción a la plataforma.", "ADMINISTRATIVO", ahora, dentroDeUnMes, adminUser, null, null)));

        Course cursoOnboarding = courseRepository.findByTitle("Onboarding General")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Onboarding General", "Curso introductorio para nuevos empleados sobre la empresa.", "ADMINISTRATIVO", ahora, dentroDeUnMes, buddyUser, null, null)));

        Course cursoSeguridad = courseRepository.findByTitle("Seguridad Informática")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Seguridad Informática", "Buenas prácticas de seguridad digital dentro de la organización.", "SEGURIDAD", ahora, ayer, buddyUser, null, null)));

        Course cursoRRHH = courseRepository.findByTitle("Políticas de RRHH")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Políticas de RRHH", "Conoce las políticas y beneficios de la empresa.", "RRHH", ahora, manana, rrhhUser, null, null)));

        Course cursoComunicacion = courseRepository.findByTitle("Herramientas de Comunicación")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Herramientas de Comunicación", "Aprende sobre las herramientas de comunicación interna.", "SOPORTE", ahora, dentroDeUnMes, buddyUser2, null, null)));

        Course cursoCultura = courseRepository.findByTitle("Cultura Corporativa")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Cultura Corporativa", "Descubre los valores y la cultura de la organización.", "ADMINISTRATIVO", ahora, dentroDeUnMes, adminUser2, null, null)));

        Course cursoSalud = courseRepository.findByTitle("Salud Ocupacional")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Salud Ocupacional", "Principios básicos de salud y seguridad laboral.", "SEGURIDAD", ahora, dentroDeUnMes, rrhhUser2, null, null)));

        Course cursoJava = courseRepository.findByTitle("Introducción a Java")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Introducción a Java", "Principios básicos de programación en java.", "IT", ahora, dentroDeQuincena, buddyAlex, null, null)));

        // ---------- SECCIONES (orden en cada curso) ----------
        Section s1 = sectionRepository.findByCourseIdAndTitle(cursoOnboarding.getId(), "Bienvenida")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Bienvenida", "1", cursoOnboarding, null,null)));

        Section s2 = sectionRepository.findByCourseIdAndTitle(cursoOnboarding.getId(), "Historia de la empresa")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Historia de la empresa", "2", cursoOnboarding, null, null)));

        Section s3 = sectionRepository.findByCourseIdAndTitle(cursoSeguridad.getId(), "Contraseñas seguras")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Contraseñas seguras", "1", cursoSeguridad, null, null)));

        Section s4 = sectionRepository.findByCourseIdAndTitle(cursoSeguridad.getId(), "Correo corporativo")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Correo corporativo", "2", cursoSeguridad, null, null)));

        Section s5 = sectionRepository.findByCourseIdAndTitle(cursoRRHH.getId(), "Vacaciones y licencias")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Vacaciones y licencias", "1", cursoRRHH, null, null)));

        Section s6 = sectionRepository.findByCourseIdAndTitle(cursoRRHH.getId(), "Beneficios corporativos")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Beneficios corporativos", "2", cursoRRHH, null, null)));

        Section s7 = sectionRepository.findByCourseIdAndTitle(cursoComunicacion.getId(), "Uso de Slack")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Uso de Slack", "1", cursoComunicacion, null, null)));

        Section s8 = sectionRepository.findByCourseIdAndTitle(cursoComunicacion.getId(), "Reuniones efectivas")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Reuniones efectivas", "2", cursoComunicacion, null, null)));

        Section s9 = sectionRepository.findByCourseIdAndTitle(cursoCultura.getId(), "Valores y misión")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Valores y misión", "1", cursoCultura, null, null)));

        Section s10 = sectionRepository.findByCourseIdAndTitle(cursoCultura.getId(), "Historia reciente")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Historia reciente", "2", cursoCultura, null, null)));

        Section s11 = sectionRepository.findByCourseIdAndTitle(cursoSalud.getId(), "Ergonomía en el trabajo")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Ergonomía en el trabajo", "1", cursoSalud, null, null)));

        Section s12 = sectionRepository.findByCourseIdAndTitle(cursoSalud.getId(), "Prevención de lesiones")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Prevención de lesiones", "2", cursoSalud, null, null)));

        Section s13 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Introducción a la plataforma")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Introducción a la plataforma", "1", cursoInicial, null, null)));

        Section s14 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Navegación básica")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Navegación básica", "2", cursoInicial, null, null)));

        Section s15 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Recursos de aprendizaje")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Recursos de aprendizaje", "3", cursoInicial, null, null)));

        Section s16 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Herramientas esenciales")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Herramientas esenciales", "4", cursoInicial, null, null)));

        Section s17 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Políticas clave")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Políticas clave", "5", cursoInicial, null, null)));

        Section s18 = sectionRepository.findByCourseIdAndTitle(cursoInicial.getId(), "Resumen y próximos pasos")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Resumen y próximos pasos", "6", cursoInicial, null, null)));

        Section s19 = sectionRepository.findByCourseIdAndTitle(cursoJava.getId(), "Introducción a la programación en Java")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Introducción a la programación en Java", "1", cursoJava, null, null)));

        Section s20 = sectionRepository.findByCourseIdAndTitle(cursoJava.getId(), "Spring Boot en Java")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Spring Boot en Java", "2", cursoJava, null, null)));

        Section s21 = sectionRepository.findByCourseIdAndTitle(cursoJava.getId(), "Exámen Java")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Exámen Java", "3", cursoJava, null, null)));

        // Actualizar cursos con secciones
        cursoOnboarding.setSections(List.of(s1, s2));
        courseRepository.save(cursoOnboarding);

        cursoSeguridad.setSections(List.of(s3, s4));
        courseRepository.save(cursoSeguridad);

        cursoRRHH.setSections(List.of(s5, s6));
        courseRepository.save(cursoRRHH);

        cursoComunicacion.setSections(List.of(s7, s8));
        courseRepository.save(cursoComunicacion);

        cursoCultura.setSections(List.of(s9, s10));
        courseRepository.save(cursoCultura);

        cursoSalud.setSections(List.of(s11, s12));
        courseRepository.save(cursoSalud);

        cursoInicial.setSections(List.of(s13, s14, s15, s16, s17, s18));
        courseRepository.save(cursoInicial);

        cursoJava.setSections(List.of(s19, s20, s21));
        courseRepository.save(cursoJava);

        // ---------- CONTENIDOS DE SECCIONES ----------
        if (s1.getContent() == null) {
            VideoContent c1 = new VideoContent();
            c1.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c1.setSection(s1);
            s1.setContent(c1);
            sectionContentRepository.save(c1);
        }
        if (s2.getContent() == null) {
            DocumentContent c2 = new DocumentContent();
            c2.setUrl("https://drive.google.com/file/d/1P3BG8VYulq1voYKJ-HF9XU521ogbs2fT/view?usp=sharing");
            c2.setSection(s2);
            s2.setContent(c2);
            sectionContentRepository.save(c2);
        }
        if (s3.getContent() == null) {
            VideoContent c3 = new VideoContent();
            c3.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c3.setSection(s3);
            s3.setContent(c3);
            sectionContentRepository.save(c3);
        }
        if (s4.getContent() == null) {
            DocumentContent c4 = new DocumentContent();
            c4.setUrl("https://drive.google.com/file/d/1P3BG8VYulq1voYKJ-HF9XU521ogbs2fT/view?usp=sharing");
            c4.setSection(s4);
            s4.setContent(c4);
            sectionContentRepository.save(c4);
        }
        if (s5.getContent() == null) {
            DocumentContent c5 = new DocumentContent();
            c5.setUrl("https://drive.google.com/file/d/1P3BG8VYulq1voYKJ-HF9XU521ogbs2fT/view?usp=sharing");
            c5.setSection(s5);
            s5.setContent(c5);
            sectionContentRepository.save(c5);
        }
        if (s6.getContent() == null) {
            VideoContent c6 = new VideoContent();
            c6.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c6.setSection(s6);
            s6.setContent(c6);
            sectionContentRepository.save(c6);
        }
        if (s7.getContent() == null) {
            VideoContent c7 = new VideoContent();
            c7.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c7.setSection(s7);
            s7.setContent(c7);
            sectionContentRepository.save(c7);
        }
        if (s8.getContent() == null) {
            ExamContent c8 = new ExamContent();
            c8.setTimeLimit(10);

            ExamQuestion q8_1 = new ExamQuestion();
            q8_1.setType(QuestionType.SINGLE_CHOICE);
            q8_1.setText("¿Cuál es el objetivo principal de una reunión efectiva?");
            ExamOption o8_11 = new ExamOption(); o8_11.setText("Tomar decisiones y/o alinear al equipo con un objetivo claro"); o8_11.setCorrect(true);
            ExamOption o8_12 = new ExamOption(); o8_12.setText("Llenar el tiempo y socializar"); o8_12.setCorrect(false);
            ExamOption o8_13 = new ExamOption(); o8_13.setText("Repetir información que podría enviarse por email"); o8_13.setCorrect(false);
            q8_1.setOptions(List.of(o8_11, o8_12, o8_13));

            ExamQuestion q8_2 = new ExamQuestion();
            q8_2.setType(QuestionType.MULTIPLE_CHOICE);
            q8_2.setText("¿Qué elementos debe incluir una agenda de reunión?");
            ExamOption o8_21 = new ExamOption(); o8_21.setText("Temas con tiempo estimado"); o8_21.setCorrect(true);
            ExamOption o8_22 = new ExamOption(); o8_22.setText("Responsables por tema"); o8_22.setCorrect(true);
            ExamOption o8_23 = new ExamOption(); o8_23.setText("Chistes para romper el hielo"); o8_23.setCorrect(false);
            q8_2.setOptions(List.of(o8_21, o8_22, o8_23));

            ExamQuestion q8_3 = new ExamQuestion();
            q8_3.setType(QuestionType.SINGLE_CHOICE);
            q8_3.setText("Si la conversación se desvía del tema, ¿qué conviene hacer?");
            ExamOption o8_31 = new ExamOption(); o8_31.setText("Registrar el tema en un 'parking lot' y volver a la agenda"); o8_31.setCorrect(true);
            ExamOption o8_32 = new ExamOption(); o8_32.setText("Seguir el desvío hasta que se resuelva"); o8_32.setCorrect(false);
            ExamOption o8_33 = new ExamOption(); o8_33.setText("Cancelar la reunión"); o8_33.setCorrect(false);
            q8_3.setOptions(List.of(o8_31, o8_32, o8_33));

            ExamQuestion q8_4 = new ExamQuestion();
            q8_4.setType(QuestionType.MULTIPLE_CHOICE);
            q8_4.setText("¿Cuándo una reunión debió ser asincrónica (email/chat)?");
            ExamOption o8_41 = new ExamOption(); o8_41.setText("Cuando no se requieren decisiones ni discusión"); o8_41.setCorrect(true);
            ExamOption o8_42 = new ExamOption(); o8_42.setText("Cuando es sólo un status unidireccional"); o8_42.setCorrect(true);
            ExamOption o8_43 = new ExamOption(); o8_43.setText("Cuando se necesita lluvia de ideas en vivo"); o8_43.setCorrect(false);
            q8_4.setOptions(List.of(o8_41, o8_42, o8_43));

            ExamQuestion q8_5 = new ExamQuestion();
            q8_5.setType(QuestionType.MULTIPLE_CHOICE);
            q8_5.setText("¿Cuál es el rol del facilitador?");
            ExamOption o8_51 = new ExamOption(); o8_51.setText("Cuidar los tiempos"); o8_51.setCorrect(true);
            ExamOption o8_52 = new ExamOption(); o8_52.setText("Fomentar la participación"); o8_52.setCorrect(true);
            ExamOption o8_53 = new ExamOption(); o8_53.setText("Resumir decisiones y próximos pasos"); o8_53.setCorrect(true);
            ExamOption o8_54 = new ExamOption(); o8_54.setText("Hablar la mayor parte del tiempo"); o8_54.setCorrect(false);
            q8_5.setOptions(List.of(o8_51, o8_52, o8_53, o8_54));

            ExamQuestion q8_6 = new ExamQuestion();
            q8_6.setType(QuestionType.MULTIPLE_CHOICE);
            q8_6.setText("¿Qué debe incluir el cierre de la reunión?");
            ExamOption o8_61 = new ExamOption(); o8_61.setText("Resumen de decisiones"); o8_61.setCorrect(true);
            ExamOption o8_62 = new ExamOption(); o8_62.setText("Lista de action items con responsables y fechas"); o8_62.setCorrect(true);
            ExamOption o8_63 = new ExamOption(); o8_63.setText("Opiniones irrelevantes"); o8_63.setCorrect(false);
            q8_6.setOptions(List.of(o8_61, o8_62, o8_63));

            ExamQuestion q8_7 = new ExamQuestion();
            q8_7.setType(QuestionType.MULTIPLE_CHOICE);
            q8_7.setText("Buenas prácticas de puntualidad");
            ExamOption o8_71 = new ExamOption(); o8_71.setText("Empezar y terminar a horario"); o8_71.setCorrect(true);
            ExamOption o8_72 = new ExamOption(); o8_72.setText("Dejar 5 minutos de buffer entre reuniones"); o8_72.setCorrect(true);
            ExamOption o8_73 = new ExamOption(); o8_73.setText("Esperar 15 minutos a los que llegan tarde"); o8_73.setCorrect(false);
            q8_7.setOptions(List.of(o8_71, o8_72, o8_73));

            c8.setQuestions(List.of(q8_1, q8_2, q8_3, q8_4, q8_5, q8_6, q8_7));
            c8.setSection(s8);
            s8.setContent(c8);
            sectionContentRepository.save(c8);
        }

        if (s9.getContent() == null) {
            DocumentContent c9 = new DocumentContent();
            c9.setUrl("https://drive.google.com/file/d/1P3BG8VYulq1voYKJ-HF9XU521ogbs2fT/view?usp=sharing");
            c9.setSection(s9);
            s9.setContent(c9);
            sectionContentRepository.save(c9);
        }
        if (s10.getContent() == null) {
            VideoContent c10 = new VideoContent();
            c10.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c10.setSection(s10);
            s10.setContent(c10);
            sectionContentRepository.save(c10);
        }
        if (s11.getContent() == null) {
            VideoContent c11 = new VideoContent();
            c11.setUrl("https://www.youtube.com/watch?v=IsNXLrTaJ5o&list=RDIsNXLrTaJ5o&start_radio=1");
            c11.setSection(s11);
            s11.setContent(c11);
            sectionContentRepository.save(c11);
        }
        if (s12.getContent() == null) {
            ExamContent c12 = new ExamContent();
            c12.setTimeLimit(10);

            ExamQuestion q12_1 = new ExamQuestion();
            q12_1.setType(QuestionType.SINGLE_CHOICE);
            q12_1.setText("Altura correcta del monitor en el escritorio");
            ExamOption o12_11 = new ExamOption(); o12_11.setText("Borde superior a la altura de los ojos"); o12_11.setCorrect(true);
            ExamOption o12_12 = new ExamOption(); o12_12.setText("Mucho más alto que los ojos"); o12_12.setCorrect(false);
            ExamOption o12_13 = new ExamOption(); o12_13.setText("Bastante por debajo de los ojos"); o12_13.setCorrect(false);
            q12_1.setOptions(List.of(o12_11, o12_12, o12_13));

            ExamQuestion q12_2 = new ExamQuestion();
            q12_2.setType(QuestionType.SINGLE_CHOICE);
            q12_2.setText("Técnica adecuada para levantar peso");
            ExamOption o12_21 = new ExamOption(); o12_21.setText("Flexionar rodillas y mantener espalda recta"); o12_21.setCorrect(true);
            ExamOption o12_22 = new ExamOption(); o12_22.setText("Doblar la cintura con las piernas estiradas"); o12_22.setCorrect(false);
            ExamOption o12_23 = new ExamOption(); o12_23.setText("Girar el tronco mientras se eleva la carga"); o12_23.setCorrect(false);
            q12_2.setOptions(List.of(o12_21, o12_22, o12_23));

            ExamQuestion q12_3 = new ExamQuestion();
            q12_3.setType(QuestionType.SINGLE_CHOICE);
            q12_3.setText("Pausas recomendadas en trabajo frente a PC");
            ExamOption o12_31 = new ExamOption(); o12_31.setText("Micro-pausas frecuentes y cambios posturales"); o12_31.setCorrect(true);
            ExamOption o12_32 = new ExamOption(); o12_32.setText("No hacer pausas para no perder el foco"); o12_32.setCorrect(false);
            ExamOption o12_33 = new ExamOption(); o12_33.setText("Una única pausa larga al final del día"); o12_33.setCorrect(false);
            q12_3.setOptions(List.of(o12_31, o12_32, o12_33));

            ExamQuestion q12_4 = new ExamQuestion();
            q12_4.setType(QuestionType.MULTIPLE_CHOICE);
            q12_4.setText("Signos tempranos de lesión por esfuerzo repetitivo (LER/RSI)");
            ExamOption o12_41 = new ExamOption(); o12_41.setText("Hormigueo, entumecimiento o dolor persistente"); o12_41.setCorrect(true);
            ExamOption o12_42 = new ExamOption(); o12_42.setText("Mejora al ignorar el dolor y seguir"); o12_42.setCorrect(false);
            ExamOption o12_43 = new ExamOption(); o12_43.setText("Fatiga ocular y visión borrosa"); o12_43.setCorrect(true);
            q12_4.setOptions(List.of(o12_41, o12_42, o12_43));

            ExamQuestion q12_5 = new ExamQuestion();
            q12_5.setType(QuestionType.SINGLE_CHOICE);
            q12_5.setText("Posición de las muñecas al teclear");
            ExamOption o12_51 = new ExamOption(); o12_51.setText("Neutras, no dobladas hacia arriba/abajo"); o12_51.setCorrect(true);
            ExamOption o12_52 = new ExamOption(); o12_52.setText("Apoyadas con fuerza en el borde de la mesa"); o12_52.setCorrect(false);
            ExamOption o12_53 = new ExamOption(); o12_53.setText("Extendidas hacia arriba para alcanzar las teclas"); o12_53.setCorrect(false);
            q12_5.setOptions(List.of(o12_51, o12_52, o12_53));

            ExamQuestion q12_6 = new ExamQuestion();
            q12_6.setType(QuestionType.SINGLE_CHOICE);
            q12_6.setText("Distancia y ángulo de la pantalla");
            ExamOption o12_61 = new ExamOption(); o12_61.setText("A ~50–70 cm del rostro, sin reflejos"); o12_61.setCorrect(true);
            ExamOption o12_62 = new ExamOption(); o12_62.setText("A 20 cm para ver mejor"); o12_62.setCorrect(false);
            ExamOption o12_63 = new ExamOption(); o12_63.setText("Con la pantalla mirando hacia una ventana brillante"); o12_63.setCorrect(false);
            q12_6.setOptions(List.of(o12_61, o12_62, o12_63));

            c12.setQuestions(List.of(q12_1, q12_2, q12_3, q12_4, q12_5, q12_6));
            c12.setSection(s12);
            s12.setContent(c12);
            sectionContentRepository.save(c12);
        }
        if (s13.getContent() == null) {
            VideoContent c13 = new VideoContent();
            c13.setUrl("https://www.youtube.com/watch?v=kLyjPaXl0uM");
            c13.setSection(s13);
            s13.setContent(c13);
            sectionContentRepository.save(c13);
        }
        if (s14.getContent() == null) {
            ImageContent c14 = new ImageContent();
            c14.setUrl("https://i.imgur.com/ZUN9PdX.png");
            c14.setSection(s14);
            s14.setContent(c14);
            sectionContentRepository.save(c14);
        }
        if (s15.getContent() == null) {
            DocumentContent c15 = new DocumentContent();
            c15.setUrl("https://drive.google.com/file/d/1P3BG8VYulq1voYKJ-HF9XU521ogbs2fT/view?usp=sharing");
            c15.setSection(s15);
            s15.setContent(c15);
            sectionContentRepository.save(c15);
        }
        if (s16.getContent() == null) {
            VideoContent c16 = new VideoContent();
            c16.setUrl("https://www.youtube.com/watch?v=3Q3LsGLtbfU");
            c16.setSection(s16);
            s16.setContent(c16);
            sectionContentRepository.save(c16);
        }
        if (s17.getContent() == null) {
            ImageContent c17 = new ImageContent();
            c17.setUrl("https://www.frba.utn.edu.ar/wp-content/uploads/2021/09/logo_disi-1.png");
            c17.setSection(s17);
            s17.setContent(c17);
            sectionContentRepository.save(c17);
        }
        if (s18.getContent() == null) {
            DocumentContent c18 = new DocumentContent();
            c18.setUrl("https://docs.google.com/document/d/1DYf0ZTqEcwA6MMHUqYL9St9VtS7xvSqu/edit");
            c18.setSection(s18);
            s18.setContent(c18);
            sectionContentRepository.save(c18);
        }
        if (s19.getContent() == null) {
            DocumentContent c19 = new DocumentContent();
            c19.setUrl("https://drive.google.com/file/d/1kiQuXL6AA6P9cFaC2jf-gGfE3NFsWbbG/view?usp=sharing");
            c19.setSection(s19);
            s19.setContent(c19);
            sectionContentRepository.save(c19);
        }
        if (s20.getContent() == null) {
            VideoContent c20 = new VideoContent();
            c20.setUrl("https://www.youtube.com/watch?v=3vN2R00YUq4");
            c20.setSection(s20);
            s20.setContent(c20);
            sectionContentRepository.save(c20);
        }

        if (s21.getContent() == null) {
            ExamContent c21 = new ExamContent();
            c21.setTimeLimit(10);

            ExamQuestion q21_1 = new ExamQuestion();
            q21_1.setType(QuestionType.SINGLE_CHOICE);
            q21_1.setText("¿Cuál es el framework más famoso de la JVM según el video?");
            ExamOption o21_11 = new ExamOption(); o21_11.setText("Maven"); o21_11.setCorrect(false);
            ExamOption o21_12 = new ExamOption(); o21_12.setText("Gradle"); o21_12.setCorrect(false);
            ExamOption o21_13 = new ExamOption(); o21_13.setText("Spring Boot"); o21_13.setCorrect(true);
            ExamOption o21_14 = new ExamOption(); o21_14.setText("Kotlin"); o21_14.setCorrect(false);
            q21_1.setOptions(List.of(o21_11, o21_12, o21_13,o21_14));

            ExamQuestion q21_2 = new ExamQuestion();
            q21_2.setType(QuestionType.SINGLE_CHOICE);
            q21_2.setText("¿Qué herramienta se utiliza clásicamente en el mundo de Spring Boot para crear la base de código?");
            ExamOption o21_21 = new ExamOption(); o21_21.setText("IntelliJ"); o21_21.setCorrect(false);
            ExamOption o21_22 = new ExamOption(); o21_22.setText("Spring Initializer"); o21_22.setCorrect(true);
            ExamOption o21_23 = new ExamOption(); o21_23.setText("Gradle"); o21_23.setCorrect(false);
            ExamOption o21_24 = new ExamOption(); o21_24.setText("Kotlin API Skeleton"); o21_24.setCorrect(false);
            q21_2.setOptions(List.of(o21_21, o21_22, o21_23,o21_24));

            ExamQuestion q21_3 = new ExamQuestion();
            q21_3.setType(QuestionType.SINGLE_CHOICE);
            q21_3.setText("¿Qué hace la anotación @SpringBootApplication?");
            ExamOption o21_31 = new ExamOption(); o21_31.setText("Crea un controlador REST."); o21_31.setCorrect(false);
            ExamOption o21_32 = new ExamOption(); o21_32.setText("Define un punto de entrada para la aplicación Spring Boot."); o21_32.setCorrect(true);
            ExamOption o21_33 = new ExamOption(); o21_33.setText("Especifica el verbo HTTP a usar."); o21_33.setCorrect(false);
            ExamOption o21_34 = new ExamOption(); o21_34.setText("Define una clase como un servicio."); o21_34.setCorrect(false);
            q21_3.setOptions(List.of(o21_31, o21_32, o21_33,o21_34));

            ExamQuestion q21_4 = new ExamQuestion();
            q21_4.setType(QuestionType.MULTIPLE_CHOICE);
            q21_4.setText("¿Qué afirmaciones son verdaderas sobre el uso de @RestController y @GetMapping en Spring Boot, según el video?");
            ExamOption o21_41 = new ExamOption(); o21_41.setText("@RestController crea una clase que es un controlador y un servicio."); o21_41.setCorrect(true);
            ExamOption o21_42 = new ExamOption(); o21_42.setText("@GetMapping especifica el path al que debe responder el endpoint."); o21_42.setCorrect(true);
            ExamOption o21_43 = new ExamOption(); o21_43.setText("@RestController obliga a que todos los endpoints devuelvan un response body por defecto."); o21_43.setCorrect(false);
            ExamOption o21_44 = new ExamOption(); o21_44.setText("@GetMapping indica el verbo HTTP a usar para un endpoint."); o21_44.setCorrect(true);
            q21_4.setOptions(List.of(o21_41, o21_42, o21_43,o21_44));

            ExamQuestion q21_5 = new ExamQuestion();
            q21_5.setType(QuestionType.MULTIPLE_CHOICE);
            q21_5.setText("¿Qué elementos incluye el repositorio 'Colin API API Skeleton' según lo mencionado en el video?");
            ExamOption o21_51 = new ExamOption(); o21_51.setText("Tests de aceptación."); o21_51.setCorrect(true);
            ExamOption o21_52 = new ExamOption(); o21_52.setText("Un archivo XML para la gestión de tareas."); o21_52.setCorrect(true);
            ExamOption o21_53 = new ExamOption(); o21_53.setText("Un linter."); o21_53.setCorrect(false);
            ExamOption o21_54 = new ExamOption(); o21_54.setText("Documentación detallada en un archivo README."); o21_54.setCorrect(true);
            q21_5.setOptions(List.of(o21_51, o21_52, o21_53, o21_54));

            ExamQuestion q21_6 = new ExamQuestion();
            q21_6.setType(QuestionType.SINGLE_CHOICE);
            q21_6.setText("¿Cuál de las siguientes NO es una característica principal del lenguaje de programación Java?");
            ExamOption o21_61 = new ExamOption(); o21_61.setText("Orientado a objetos"); o21_61.setCorrect(false);
            ExamOption o21_62 = new ExamOption(); o21_62.setText("Independiente de la plataforma"); o21_62.setCorrect(false);
            ExamOption o21_63 = new ExamOption(); o21_63.setText("Robusto y fiable"); o21_63.setCorrect(false);
            ExamOption o21_64 = new ExamOption(); o21_64.setText("Dependiente del sistema operativo"); o21_64.setCorrect(true);
            q21_6.setOptions(List.of(o21_61, o21_62, o21_63,o21_64));

            ExamQuestion q21_7 = new ExamQuestion();
            q21_7.setType(QuestionType.SINGLE_CHOICE);
            q21_7.setText("¿Qué componente de Java permite ejecutar aplicaciones pero no compilar desarrollos?");
            ExamOption o21_71 = new ExamOption(); o21_71.setText("JDK (Java Development Kit)"); o21_71.setCorrect(false);
            ExamOption o21_72 = new ExamOption(); o21_72.setText("JRE (Java Runtime Environment)"); o21_72.setCorrect(true);
            ExamOption o21_73 = new ExamOption(); o21_73.setText("SDK (Software Development Kit)"); o21_73.setCorrect(false);
            ExamOption o21_74 = new ExamOption(); o21_74.setText("IDE (Integrated Development Environment)"); o21_74.setCorrect(false);
            q21_7.setOptions(List.of(o21_71, o21_72, o21_73,o21_74));

            ExamQuestion q21_8 = new ExamQuestion();
            q21_8.setType(QuestionType.SINGLE_CHOICE);
            q21_8.setText("¿Cuál es el propósito principal de los 'paquetes' en Java?");
            ExamOption o21_81 = new ExamOption(); o21_81.setText("Definir interfaces para la herencia múltiple"); o21_81.setCorrect(false);
            ExamOption o21_82 = new ExamOption(); o21_82.setText("Agrupar un conjunto de clases relacionadas bajo un mismo espacio de nombres"); o21_82.setCorrect(true);
            ExamOption o21_83 = new ExamOption(); o21_83.setText("Controlar el acceso a la memoria y evitar errores de segmentación"); o21_83.setCorrect(false);
            ExamOption o21_84 = new ExamOption(); o21_84.setText("Optimizar el rendimiento del código mediante la compilación just-in-time"); o21_84.setCorrect(false);
            q21_8.setOptions(List.of(o21_81, o21_82, o21_83,o21_84));

            c21.setQuestions(List.of(q21_1, q21_2, q21_3, q21_4, q21_5, q21_6, q21_7,q21_8));
            c21.setSection(s21);
            s21.setContent(c21);
            sectionContentRepository.save(c21);
        }

        // ===================== SEED MÉTRICAS =====================
            // ------- Buddy Alex -------


            // ------- Empleados de Alex -------
            String[][] emps = {
                    {"mario.ruiz@empresa.com",   "Mario",   "Ruiz"},
                    {"camila.diaz@empresa.com",  "Camila",  "Díaz"},
                    {"sofia.lopez@empresa.com",  "Sofía",   "López"},
                    {"juan.paz@empresa.com",     "Juan",    "Paz"},
                    {"luis.mansilla@empresa.com","Luis",    "Mansilla"},
                    {"mariana.suarez@empresa.com","Mariana","Suárez"},
            };
            java.util.List<User> empleadosAlex = new java.util.ArrayList<>();
            for (String[] e : emps) {
                String email = e[0], nombre = e[1], apellido = e[2];
                User u = userRepository.findByEmail(email).orElseGet(() ->
                        userRepository.save(
                                new User(
                                        null, nombre, apellido, email, passwordService.hashPassword("empleado123"),
                                        "IT", ahora, 1, "Sin dirección", "1100000000", ahora,
                                        empleado, null, null, buddyAlex
                                )
                        )
                );
                if (u.getBuddy() == null || !u.getBuddy().getId().equals(buddyAlex.getId())) {
                    u.setBuddy(buddyAlex);
                    u = userRepository.save(u);
                }
                empleadosAlex.add(u);
            }
        // ===================== FIN SEED MÉTRICAS =====================

        // ============== NUEVO CURSO CON ENCUESTA==============

        Course cursoSistemas = courseRepository.findByTitle("Introducción a Sistemas")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Introducción a Sistemas", "Aprende lo básico sobre nuestros sistemas.", "SOPORTE", ahora, dentroDeUnMes, rrhhUser, null, null)));

        Section sDocxs = new Section(
                null,
                "Lumina Docxs",
                "1",
                cursoSistemas,
                null,
                null
        );
        sDocxs = sectionRepository.save(sDocxs);

        if (sDocxs.getContent() == null) {
            DocumentContent cDocxs = new DocumentContent();
            cDocxs.setUrl("https://docs.google.com/document/d/1DYf0ZTqEcwA6MMHUqYL9St9VtS7xvSqu/edit");
            cDocxs.setSection(sDocxs);
            sDocxs.setContent(cDocxs);
            sectionContentRepository.save(cDocxs);
        }

        cursoSistemas.setSections(List.of(sDocxs));
        courseRepository.save(cursoSistemas);

        List<User> empleados = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "Empleado".equalsIgnoreCase(u.getRole().getName())).toList();

        List<Course> todosLosCursos = List.of(
                cursoInicial, cursoOnboarding, cursoSeguridad, cursoRRHH,
                cursoComunicacion, cursoCultura, cursoSalud, cursoSistemas,
                cursoJava
        );

            for (Course c : todosLosCursos) {
                List<Section> secs = c.getSections() == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(c.getSections());

                // --- Exam ---
                ExamContent ex = null;
                Section secExamExistente = (secs == null) ? null :
                        secs.stream().filter(sec -> sec.getContent() instanceof ExamContent).findFirst().orElse(null);
                if (secExamExistente != null) {
                    ex = (ExamContent) secExamExistente.getContent();
                } else {
                    Section sEx = new Section(null, "Examen de " + c.getTitle(), nextOrder(secs), c, null, null);
                    sEx = sectionRepository.save(sEx);
                    ex = buildDefaultExamForCourse(c, sEx);
                    ex = sectionContentRepository.saveAndFlush(ex);
                    secs.add(sEx);
                }

                // --- Survey ---
                SurveyContent sv = null;
                Section secSurveyExistente = (secs == null) ? null :
                        secs.stream().filter(sec -> sec.getContent() instanceof SurveyContent).findFirst().orElse(null);
                if (secSurveyExistente != null) {
                    sv = (SurveyContent) secSurveyExistente.getContent();
                } else {
                    Section sSv = new Section(null, "Encuesta de " + c.getTitle(), nextOrder(secs), c, null, null);
                    sSv = sectionRepository.save(sSv);
                    sv = buildDefaultSurveyForCourse(c, sSv);
                    sv = sectionContentRepository.saveAndFlush(sv);
                    secs.add(sSv);
                }

                if (!secs.equals(c.getSections())) {
                    c.setSections(secs);
                    courseRepository.save(c);
                }

                // ahora siempre hay ex y sv -> sembramos resultados
                for (User emp : empleados) {
                    boolean passBias = java.util.concurrent.ThreadLocalRandom.current().nextDouble() < 0.60;
                    if (cursoJava == null || !c.getId().equals(cursoJava.getId())) {
                        seedExamResultIfAbsent(ex, emp, passBias);
                        seedSurveyResultIfAbsent(sv, emp);
                    }
                }
            }
        // ---------- ASIGNAR TODOS LOS CURSOS A TODOS LOS EMPLEADOS ----------
        for (Course c : todosLosCursos) {

            if (cursoJava != null && c.getId().equals(cursoJava.getId())) {
                continue;
            }

            boolean yaAsignado = enrollmentRepository
                    .findByUserIdAndCourseId(rrhhUser.getId(), c.getId())
                    .isPresent();

            if (!yaAsignado) {
                Section startSec = null;
                List<Section> secs = c.getSections();
                if (secs != null && !secs.isEmpty()) {
                    startSec = secs.stream()
                            .sorted((a, b) -> {
                                int oa = 0, ob = 0;
                                try {
                                    oa = Integer.parseInt(a.getOrder());
                                } catch (Exception ignore) {
                                }
                                try {
                                    ob = Integer.parseInt(b.getOrder());
                                } catch (Exception ignore) {
                                }
                                return Integer.compare(oa, ob);
                            })
                            .findFirst().orElse(null);
                }

                EnrollmentId eid = new EnrollmentId(rrhhUser.getId(), c.getId());
                Enrollment en = new Enrollment(
                        eid,
                        rrhhUser,
                        c,
                        ahora,
                        null,
                        "ASIGNADO",
                        false,
                        startSec
                );
                enrollmentRepository.save(en);
            }
        }
        for (User emp : empleados) {
            for (Course c : todosLosCursos) {

                if (cursoJava != null && c.getId().equals(cursoJava.getId())) {
                    continue;
                }

                boolean yaAsignado = enrollmentRepository
                        .findByUserIdAndCourseId(emp.getId(), c.getId())
                        .isPresent();

                if (!yaAsignado) {
                    Section startSec = null;
                    List<Section> secs = c.getSections();
                    if (secs != null && !secs.isEmpty()) {
                        startSec = secs.stream()
                                .sorted((a, b) -> {
                                    int oa = 0, ob = 0;
                                    try { oa = Integer.parseInt(a.getOrder()); } catch (Exception ignore) {}
                                    try { ob = Integer.parseInt(b.getOrder()); } catch (Exception ignore) {}
                                    return Integer.compare(oa, ob);
                                })
                                .findFirst().orElse(null);
                    }

                    EnrollmentId eid = new EnrollmentId(emp.getId(), c.getId());
                    Enrollment en = new Enrollment(
                            eid,
                            emp,
                            c,
                            ahora,
                            null,
                            "ASIGNADO",
                            false,
                            startSec
                    );
                    enrollmentRepository.save(en);
                }
            }
        }

        // ---------- RANDOMIZAR PROGRESO DE ENROLLMENTS ----------
        for (User emp : empleados) {
            for (Course c : todosLosCursos) {
                enrollmentRepository.findByUserIdAndCourseId(emp.getId(), c.getId()).ifPresent(en -> {
                    List<Section> secs = c.getSections();
                    if (secs == null || secs.isEmpty()) return;

                    // Ordenamos por "order" para poder elegir una sección coherente
                    List<Section> ordenadas = new java.util.ArrayList<>(secs);
                    ordenadas.sort((a, b) -> {
                        int oa = 0, ob = 0;
                        try { oa = Integer.parseInt(a.getOrder()); } catch (Exception ignore) {}
                        try { ob = Integer.parseInt(b.getOrder()); } catch (Exception ignore) {}
                        return Integer.compare(oa, ob);
                    });

                    int n = ordenadas.size();
                    double p = java.util.concurrent.ThreadLocalRandom.current().nextDouble();

                    Section last = ordenadas.get(n - 1);

                    // Distribución: ~20% asignado, ~55% en curso, ~25% finalizado
                    if ("FINALIZADO".equalsIgnoreCase(en.getStatus()) && en.getFinishedDate() != null) {
                        // Asegurar que FINALIZADO apunte SIEMPRE a la última sección actual
                        if (en.getSection() == null || !en.getSection().getId().equals(last.getId())) {
                            en.setSection(last);
                        }

                        // Ya finalizado previamente: 90% lo mantenemos, 10% lo bajamos a "en curso" para variar
                        if (p < 0.10 && n > 1) {
                            int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(n - 1);
                            en.setStatus("ASIGNADO");
                            en.setFinishedDate(null);
                            en.setSection(ordenadas.get(idx));
                            long daysBack = java.util.concurrent.ThreadLocalRandom.current().nextLong(5, 31);
                            en.setEnrolledAt(new Date(System.currentTimeMillis() - daysBack * 24L * 60L * 60L * 1000L));
                        }
                    } else {
                        if (p < 0.22) {
                            // EN CURSO, sin avance
                            en.setStatus("ASIGNADO");
                            en.setFinishedDate(null);
                            en.setSection(ordenadas.get(0));
                            long daysBack = java.util.concurrent.ThreadLocalRandom.current().nextLong(0, 8);
                            en.setEnrolledAt(new Date(System.currentTimeMillis() - daysBack * 24L * 60L * 60L * 1000L));
                        } else if (p < 0.78 && n > 1) {
                            // EN CURSO, con avance
                            int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(1, n);
                            if (idx == n - 1 && n > 2) idx = n - 2;
                            en.setStatus("ASIGNADO");
                            en.setFinishedDate(null);
                            en.setSection(ordenadas.get(idx));
                            long daysBack = java.util.concurrent.ThreadLocalRandom.current().nextLong(3, 21);
                            en.setEnrolledAt(new Date(System.currentTimeMillis() - daysBack * 24L * 60L * 60L * 1000L));
                        } else {
                            // FINALIZADO
                            en.setStatus("FINALIZADO");
                            en.setSection(ordenadas.get(n - 1));
                            long assignedBack = java.util.concurrent.ThreadLocalRandom.current().nextLong(15, 46);
                            long duration = java.util.concurrent.ThreadLocalRandom.current().nextLong(5, Math.max(6, assignedBack));
                            Date assignedAt = new Date(System.currentTimeMillis() - assignedBack * 24L * 60L * 60L * 1000L);
                            Date completedAt = new Date(assignedAt.getTime() + duration * 24L * 60L * 60L * 1000L);
                            en.setEnrolledAt(assignedAt);
                            en.setFinishedDate(completedAt);
                        }
                    }

                    enrollmentRepository.save(en);
                });
            }
        }

    }

    private void seedExamResultIfAbsent(ExamContent exam, User user, boolean pass) {
        // ¿Ya existe?
        if (examResultRepository.findByUserAndExam(user.getId(), exam.getId_content()).isPresent()) {
            return;
        }

        List<ExamQuestionResultDTO> results = new java.util.ArrayList<>();
        int score = 0;

        for (ExamQuestion q : exam.getQuestions()) {
            List<Long> correctIds = q.getOptions().stream()
                    .filter(o -> Boolean.TRUE.equals(o.getCorrect()))
                    .map(ExamOption::getId)
                    .toList();

            List<Long> selectedIds;
            List<Long> incorrect = q.getOptions().stream()
                    .filter(o -> !Boolean.TRUE.equals(o.getCorrect()))
                    .map(ExamOption::getId)
                    .toList();

            double pCorrect = pass ? 0.75 : 0.25;
            boolean pickCorrect = java.util.concurrent.ThreadLocalRandom.current().nextDouble() < pCorrect;

            if (pickCorrect) {
                selectedIds = correctIds;
            } else {
                if (incorrect.isEmpty()) {
                    selectedIds = correctIds.isEmpty() ? java.util.List.of() : java.util.List.of(correctIds.get(0));
                } else {
                    java.util.List<Long> pool = new java.util.ArrayList<>(incorrect);
                    java.util.Collections.shuffle(pool);
                    int k = pool.size() >= 2 && java.util.concurrent.ThreadLocalRandom.current().nextBoolean() ? 2 : 1;
                    selectedIds = pool.subList(0, Math.min(k, pool.size()));
                }
            }

            boolean correct = new java.util.HashSet<>(selectedIds).equals(new java.util.HashSet<>(correctIds));
            if (correct) score++;

            ExamQuestionResultDTO qr = new ExamQuestionResultDTO();
            qr.setQuestionId(q.getId());
            qr.setSelectedOptionIds(selectedIds);
            qr.setCorrectOptionIds(correctIds);
            qr.setCorrect(correct);
            results.add(qr);
        }

        ExamResult r = new ExamResult();
        r.setExam(exam);
        r.setUser(user);
        r.setScore(score);
        r.setTotalQuestions(exam.getQuestions().size());
        r.setCompletedAt(new java.util.Date());

        try {
            r.setDetail(objectMapper.writeValueAsString(results));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("No se pudo serializar detail de ExamResult", e);
        }

        examResultRepository.save(r);
    }

    private void seedSurveyResultIfAbsent(SurveyContent survey, User user) {
        if (surveyResultRepository.findByUserAndSurvey(user.getId(), survey.getId_content()).isPresent()) {
            return;
        }

        List<SurveyQuestionResultDTO> results = new java.util.ArrayList<>();

        for (SurveyQuestion q : survey.getQuestions()) {
            List<Long> optionIds = q.getOptions().stream()
                    .map(o -> o.getId())
                    .toList();

            // Elegimos aleatoriamente una opción si hay al menos una
            List<Long> selectedIds;
            if (optionIds.isEmpty()) {
                selectedIds = java.util.Collections.emptyList();
            } else {
                int idx = ThreadLocalRandom.current().nextInt(optionIds.size());
                selectedIds = java.util.List.of(optionIds.get(idx));
            }

            SurveyQuestionResultDTO qr = new SurveyQuestionResultDTO();
            qr.setQuestionId(q.getId());
            qr.setSelectedOptionIds(selectedIds);
            results.add(qr);
        }

        SurveyResult r = new SurveyResult();
        r.setSurvey(survey);
        r.setUser(user);
        r.setTotalQuestions(survey.getQuestions().size());
        r.setCompletedAt(new java.util.Date());

        try {
            r.setDetail(objectMapper.writeValueAsString(results));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("No se pudo serializar el detail de SurveyResult", e);
        }

        surveyResultRepository.save(r);
    }

    private String nextOrder(List<Section> secs) {
        int next = (secs == null || secs.isEmpty()) ? 1
                : secs.stream()
                .map(s -> { try { return Integer.parseInt(s.getOrder()); } catch (Exception e) { return 0; } })
                .max(Integer::compareTo)
                .orElse(0) + 1;
        return Integer.toString(next);
    }

    private ExamContent buildDefaultExamForCourse(Course c, Section s) {
        ExamContent ex = new ExamContent();
        ex.setTimeLimit(10);

        // Q1
        ExamQuestion q1 = new ExamQuestion();
        q1.setType(QuestionType.SINGLE_CHOICE);
        q1.setText("Concepto clave del curso \"" + c.getTitle() + "\"");
        ExamOption q1o1 = new ExamOption(); q1o1.setText("La idea principal abordada en el curso"); q1o1.setCorrect(true);
        ExamOption q1o2 = new ExamOption(); q1o2.setText("Un tema no relacionado"); q1o2.setCorrect(false);
        ExamOption q1o3 = new ExamOption(); q1o3.setText("Una práctica obsoleta"); q1o3.setCorrect(false);
        q1.setOptions(List.of(q1o1, q1o2, q1o3));

        // Q2
        ExamQuestion q2 = new ExamQuestion();
        q2.setType(QuestionType.MULTIPLE_CHOICE);
        q2.setText("Buenas prácticas vinculadas al curso");
        ExamOption q2o1 = new ExamOption(); q2o1.setText("Aplicar lo aprendido en el trabajo diario"); q2o1.setCorrect(true);
        ExamOption q2o2 = new ExamOption(); q2o2.setText("Documentar y compartir con el equipo"); q2o2.setCorrect(true);
        ExamOption q2o3 = new ExamOption(); q2o3.setText("Ignorar las políticas definidas"); q2o3.setCorrect(false);
        q2.setOptions(List.of(q2o1, q2o2, q2o3));

        // Q3
        ExamQuestion q3 = new ExamQuestion();
        q3.setType(QuestionType.SINGLE_CHOICE);
        q3.setText("¿Qué hacer ante dudas sobre el contenido?");
        ExamOption q3o1 = new ExamOption(); q3o1.setText("Consultar material y preguntar al responsable"); q3o1.setCorrect(true);
        ExamOption q3o2 = new ExamOption(); q3o2.setText("No hacer nada"); q3o2.setCorrect(false);
        ExamOption q3o3 = new ExamOption(); q3o3.setText("Difundir la duda sin chequear"); q3o3.setCorrect(false);
        q3.setOptions(List.of(q3o1, q3o2, q3o3));

        ex.setQuestions(List.of(q1, q2, q3));
        ex.setSection(s);
        s.setContent(ex);
        return ex;
    }

    private SurveyContent buildDefaultSurveyForCourse(Course c, Section s) {
        SurveyContent survey = new SurveyContent();

        // P1
        SurveyQuestion q1 = new SurveyQuestion();
        q1.setText("¿Qué tan satisfecho estás con el curso en general?");
        SurveyOption q1o1 = new SurveyOption(); q1o1.setText("Muy satisfecho");
        SurveyOption q1o2 = new SurveyOption(); q1o2.setText("Bastante satisfecho");
        SurveyOption q1o3 = new SurveyOption(); q1o3.setText("Algo satisfecho");
        SurveyOption q1o4 = new SurveyOption(); q1o4.setText("Poco satisfecho");
        SurveyOption q1o5 = new SurveyOption(); q1o5.setText("Nada satisfecho");
        q1.setOptions(List.of(q1o1, q1o2, q1o3, q1o4, q1o5));

        // P2
        SurveyQuestion q2 = new SurveyQuestion();
        q2.setText("¿El contenido fue claro, útil y bien estructurado?");
        SurveyOption q2o1 = new SurveyOption(); q2o1.setText("Si");
        SurveyOption q2o2 = new SurveyOption(); q2o2.setText("No");
        q2.setOptions(List.of(q2o1, q2o2));

        // P3
        SurveyQuestion q3 = new SurveyQuestion();
        q3.setText("¿Qué tan efectivo fue el instructor al enseñar el material?");
        SurveyOption q3o1 = new SurveyOption(); q3o1.setText("Muy efectivo");
        SurveyOption q3o2 = new SurveyOption(); q3o2.setText("Bastante efectivo");
        SurveyOption q3o3 = new SurveyOption(); q3o3.setText("Algo efectivo");
        SurveyOption q3o4 = new SurveyOption(); q3o4.setText("Poco efectivo");
        SurveyOption q3o5 = new SurveyOption(); q3o5.setText("Nada efectivo");
        q3.setOptions(List.of(q3o1, q3o2, q3o3, q3o4, q3o5));

        // P4
        SurveyQuestion q4 = new SurveyQuestion();
        q4.setText("¿Qué tan satisfecho estas con tu Buddy asignado hasta el momento?");
        SurveyOption q4o1 = new SurveyOption(); q4o1.setText("Muy satisfecho");
        SurveyOption q4o2 = new SurveyOption(); q4o2.setText("Bastante satisfecho");
        SurveyOption q4o3 = new SurveyOption(); q4o3.setText("Algo satisfecho");
        SurveyOption q4o4 = new SurveyOption(); q4o4.setText("Poco satisfecho");
        SurveyOption q4o5 = new SurveyOption(); q4o5.setText("Nada satisfecho");
        q4.setOptions(List.of(q4o1, q4o2, q4o3, q4o4, q4o5));

        survey.setQuestions(List.of(q1, q2, q3, q4));
        survey.setSection(s);
        s.setContent(survey);
        return survey;
    }
}
