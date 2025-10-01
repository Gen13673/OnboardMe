package org.onboardme.config;

import jakarta.annotation.PostConstruct;
import org.onboardme.dao.entities.*;
import org.onboardme.dao.repositories.*;
import org.springframework.context.annotation.Configuration;
import org.onboardme.dao.entities.content.*;

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

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           CourseRepository courseRepository,
                           SectionRepository sectionRepository,
                           EnrollmentRepository enrollmentRepository,
                           SectionContentRepository sectionContentRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.sectionContentRepository = sectionContentRepository;
    }

    @PostConstruct
    public void init() {
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
                        new User(null, "Mauro", "López", "mauro.buddy@empresa.com", "buddy123", "IT", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, buddy, null, null, null )));

        User buddyUser2 = userRepository.findByEmail("sofia.buddy@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Sofía", "Martínez", "sofia.buddy@empresa.com", "buddy123", "IT", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, buddy, null, null, null)));

        User buddyUser3 = userRepository.findByEmail("lucia.buddy@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Lucía", "Diaz", "lucia.buddy@empresa.com", "buddy123", "SEGURIDAD", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, buddy, null, null, null)));

        User employeeUser = userRepository.findByEmail("laura.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Laura", "Fernández", "laura.empleado@empresa.com", "empleado123", "SOPORTE", fechaAlta, 1,"pepito 123", "556482256", fechaAlta,  empleado, null, null, buddyUser)));

        User employeeUser2 = userRepository.findByEmail("juan.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Juan", "Pérez", "juan.empleado@empresa.com", "empleado123", "GERENCIA", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser2)));

        User employeeUser3 = userRepository.findByEmail("mariana.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Mariana", "Suárez", "mariana.empleado@empresa.com", "empleado123", "GERENCIA", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser2)));

        User employeeUser4 = userRepository.findByEmail("carlos.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Carlos", "Ibarra", "carlos.empleado@empresa.com", "empleado123", "IT", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser3)));

        User employeeUser5 = userRepository.findByEmail("emma.empleado@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Emma", "Torres", "emma.empleado@empresa.com", "empleado123", "SEGURIDAD", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, empleado, null, null, buddyUser3)));

        User adminUser = userRepository.findByEmail("carlos.admin@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Carlos", "Ramírez", "carlos.admin@empresa.com", "admin123", "ADMINISTRATIVO", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, admin, null, null, buddyUser)));

        User adminUser2 = userRepository.findByEmail("maria.admin@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "María", "Núñez", "maria.admin@empresa.com", "admin123", "ADMINISTRATIVO", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, admin, null, null, buddyUser3)));

        User rrhhUser = userRepository.findByEmail("ana.rrhh@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Ana", "Gómez", "ana.rrhh@empresa.com", "rrhh123", "RRHH", fechaAlta, 1, "pepito 123", "1152423356", fechaAlta, rrhh, null, null, buddyUser)));

        User rrhhUser2 = userRepository.findByEmail("diego.rrhh@empresa.com")
                .orElseGet(() -> userRepository.save(
                        new User(null, "Diego", "López", "diego.rrhh@empresa.com", "rrhh123", "RRHH", fechaAlta, 1, "una direccion 123", "1152456456", fechaAlta, rrhh, null, null, buddyUser)));

        // ---------- CURSOS ----------
        Date ahora = new Date();
        Date dentroDeUnMes = new Date(ahora.getTime() + (1000L * 60 * 60 * 24 * 30));

        Course cursoInicial = courseRepository.findByTitle("Curso Inicial")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Curso Inicial", "Curso básico de introducción a la plataforma.", "ADMINISTRATIVO", ahora, dentroDeUnMes, adminUser, null, null)));

        Course cursoOnboarding = courseRepository.findByTitle("Onboarding General")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Onboarding General", "Curso introductorio para nuevos empleados sobre la empresa.", "ADMINISTRATIVO", ahora, dentroDeUnMes, buddyUser, null, null)));

        Course cursoSeguridad = courseRepository.findByTitle("Seguridad Informática")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Seguridad Informática", "Buenas prácticas de seguridad digital dentro de la organización.", "SEGURIDAD", ahora, dentroDeUnMes, buddyUser, null, null)));

        Course cursoRRHH = courseRepository.findByTitle("Políticas de RRHH")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Políticas de RRHH", "Conoce las políticas y beneficios de la empresa.", "RRHH", ahora, dentroDeUnMes, rrhhUser, null, null)));

        Course cursoComunicacion = courseRepository.findByTitle("Herramientas de Comunicación")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Herramientas de Comunicación", "Aprende sobre las herramientas de comunicación interna.", "SOPORTE", ahora, dentroDeUnMes, buddyUser2, null, null)));

        Course cursoCultura = courseRepository.findByTitle("Cultura Corporativa")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Cultura Corporativa", "Descubre los valores y la cultura de la organización.", "ADMINISTRATIVO", ahora, dentroDeUnMes, adminUser2, null, null)));

        Course cursoSalud = courseRepository.findByTitle("Salud Ocupacional")
                .orElseGet(() -> courseRepository.save(
                        new Course(null, "Salud Ocupacional", "Principios básicos de salud y seguridad laboral.", "SEGURIDAD", ahora, dentroDeUnMes, rrhhUser2, null, null)));

        // ---------- SECCIONES (orden en cada curso) ----------
        Section s1 = sectionRepository.findByTitle("Bienvenida")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Bienvenida", "1", cursoOnboarding, null,null)));

        Section s2 = sectionRepository.findByTitle("Historia de la empresa")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Historia de la empresa", "2", cursoOnboarding, null, null)));

        Section s3 = sectionRepository.findByTitle("Contraseñas seguras")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Contraseñas seguras", "1", cursoSeguridad, null, null)));

        Section s4 = sectionRepository.findByTitle("Correo corporativo")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Correo corporativo", "2", cursoSeguridad, null, null)));

        Section s5 = sectionRepository.findByTitle("Vacaciones y licencias")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Vacaciones y licencias", "1", cursoRRHH, null, null)));

        Section s6 = sectionRepository.findByTitle("Beneficios corporativos")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Beneficios corporativos", "2", cursoRRHH, null, null)));

        Section s7 = sectionRepository.findByTitle("Uso de Slack")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Uso de Slack", "1", cursoComunicacion, null, null)));

        Section s8 = sectionRepository.findByTitle("Reuniones efectivas")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Reuniones efectivas", "2", cursoComunicacion, null, null)));

        Section s9 = sectionRepository.findByTitle("Valores y misión")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Valores y misión", "1", cursoCultura, null, null)));

        Section s10 = sectionRepository.findByTitle("Historia reciente")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Historia reciente", "2", cursoCultura, null, null)));

        Section s11 = sectionRepository.findByTitle("Ergonomía en el trabajo")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Ergonomía en el trabajo", "1", cursoSalud, null, null)));

        Section s12 = sectionRepository.findByTitle("Prevención de lesiones")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Prevención de lesiones", "2", cursoSalud, null, null)));

        Section s13 = sectionRepository.findByTitle("Introducción a la plataforma")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Introducción a la plataforma", "1", cursoInicial, null, null)));

        Section s14 = sectionRepository.findByTitle("Navegación básica")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Navegación básica", "2", cursoInicial, null, null)));

        Section s15 = sectionRepository.findByTitle("Recursos de aprendizaje")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Recursos de aprendizaje", "3", cursoInicial, null, null)));

        Section s16 = sectionRepository.findByTitle("Herramientas esenciales")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Herramientas esenciales", "4", cursoInicial, null, null)));

        Section s17 = sectionRepository.findByTitle("Políticas clave")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Políticas clave", "5", cursoInicial, null, null)));

        Section s18 = sectionRepository.findByTitle("Resumen y próximos pasos")
                .orElseGet(() -> sectionRepository.save(
                        new Section(null, "Resumen y próximos pasos", "6", cursoInicial, null, null)));

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

        // ---------- ENROLLMENTS ----------
        EnrollmentId enrollmentId1 = new EnrollmentId(employeeUser.getId(), cursoOnboarding.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser.getId(), cursoOnboarding.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId1, employeeUser, cursoOnboarding, ahora, null, "ASIGNADO", true, s1)));

        EnrollmentId enrollmentId2 = new EnrollmentId(employeeUser.getId(), cursoSeguridad.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser.getId(), cursoSeguridad.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId2, employeeUser, cursoSeguridad, ahora, null, "ASIGNADO", false, s3)));

        EnrollmentId enrollmentId3 = new EnrollmentId(employeeUser.getId(), cursoRRHH.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser.getId(), cursoRRHH.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId3, employeeUser, cursoRRHH, ahora, null, "ASIGNADO", false, s5)));

        EnrollmentId enrollmentId4 = new EnrollmentId(employeeUser.getId(), cursoComunicacion.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser.getId(), cursoComunicacion.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId4, employeeUser, cursoComunicacion, ahora, null, "ASIGNADO", false, s7)));

        EnrollmentId enrollmentId5 = new EnrollmentId(employeeUser2.getId(), cursoOnboarding.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser2.getId(), cursoOnboarding.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId5, employeeUser2, cursoOnboarding, ahora, null, "ASIGNADO", false, s1)));

        EnrollmentId enrollmentId6 = new EnrollmentId(employeeUser2.getId(), cursoRRHH.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser2.getId(), cursoRRHH.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId6, employeeUser2, cursoRRHH, ahora, null, "ASIGNADO", false, s5)));

        EnrollmentId enrollmentId7 = new EnrollmentId(employeeUser3.getId(), cursoOnboarding.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser3.getId(), cursoOnboarding.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId7, employeeUser3, cursoOnboarding, ahora, null, "ASIGNADO", false, s1)));

        EnrollmentId enrollmentId8 = new EnrollmentId(employeeUser3.getId(), cursoComunicacion.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser3.getId(), cursoComunicacion.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId8, employeeUser3, cursoComunicacion, ahora, null, "ASIGNADO", false, s7)));

        EnrollmentId enrollmentId9 = new EnrollmentId(employeeUser.getId(), cursoCultura.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser.getId(), cursoCultura.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId9, employeeUser, cursoCultura, ahora, null, "ASIGNADO", false, s9)));

        EnrollmentId enrollmentId10 = new EnrollmentId(employeeUser2.getId(), cursoSalud.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser2.getId(), cursoSalud.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId10, employeeUser2, cursoSalud, ahora, null, "ASIGNADO", false, s11)));

        EnrollmentId enrollmentId11 = new EnrollmentId(employeeUser3.getId(), cursoCultura.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser3.getId(), cursoCultura.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId11, employeeUser3, cursoCultura, ahora, null, "ASIGNADO", false, s9)));

        EnrollmentId enrollmentId12 = new EnrollmentId(employeeUser4.getId(), cursoOnboarding.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser4.getId(), cursoOnboarding.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId12, employeeUser4, cursoOnboarding, ahora, null, "ASIGNADO", false, s1)));

        EnrollmentId enrollmentId13 = new EnrollmentId(employeeUser4.getId(), cursoSalud.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser4.getId(), cursoSalud.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId13, employeeUser4, cursoSalud, ahora, null, "ASIGNADO", false, s11)));

        EnrollmentId enrollmentId14 = new EnrollmentId(employeeUser5.getId(), cursoCultura.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser5.getId(), cursoCultura.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId14, employeeUser5, cursoCultura, ahora, null, "ASIGNADO", false, s9)));

        EnrollmentId enrollmentId15 = new EnrollmentId(employeeUser5.getId(), cursoSeguridad.getId());
        enrollmentRepository.findByUserIdAndCourseId(employeeUser5.getId(), cursoSeguridad.getId())
                .orElseGet(() -> enrollmentRepository.save(new Enrollment(enrollmentId15, employeeUser5, cursoSeguridad, ahora, null, "ASIGNADO", false, s3)));

        // ===================== SEED MÉTRICAS =====================
        {
            final long DAY = 1000L * 60 * 60 * 24;

            // ------- Buddy Alex -------
            User buddyAlex = userRepository.findByEmail("buddy.alex@empresa.com").orElseGet(() ->
                    userRepository.save(
                            new User(
                                    null, "Alex", "Gómez", "buddy.alex@empresa.com", "buddy123",
                                    "IT", ahora, 1, "Av. Siempreviva 742", "1150000000", ahora,
                                    buddy, null, null, null
                            )
                    )
            );

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
                                        null, nombre, apellido, email, "empleado123",
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

            User mario   = empleadosAlex.get(0);
            User camila  = empleadosAlex.get(1);
            User sofia   = empleadosAlex.get(2);
            User juan    = empleadosAlex.get(3);
            User luis    = empleadosAlex.get(4);
            User mariana = empleadosAlex.get(5);

            // ------- ENROLLMENTS -------
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mario.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mario.getId(), cursoOnboarding.getId()), mario, cursoOnboarding,
                                new Date(ahora.getTime() - 30 * DAY), new Date(ahora.getTime() - (30 - 12) * DAY), "FINALIZADO", false, s2)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(camila.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(camila.getId(), cursoOnboarding.getId()), camila, cursoOnboarding,
                                new Date(ahora.getTime() - 20 * DAY), new Date(ahora.getTime() - (20 - 6) * DAY), "FINALIZADO", false, s2)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(sofia.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(sofia.getId(), cursoOnboarding.getId()), sofia, cursoOnboarding,
                                new Date(ahora.getTime() - 35 * DAY), new Date(ahora.getTime() - (35 - 18) * DAY), "FINALIZADO", false, s2)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(juan.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(juan.getId(), cursoOnboarding.getId()), juan, cursoOnboarding,
                                new Date(ahora.getTime() - 22 * DAY), new Date(ahora.getTime() - (22 - 9) * DAY), "FINALIZADO", false, s2)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(luis.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(luis.getId(), cursoOnboarding.getId()), luis, cursoOnboarding,
                                new Date(ahora.getTime() - 28 * DAY), new Date(ahora.getTime() - (28 - 14) * DAY), "FINALIZADO", false, s2)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mariana.getId(), cursoOnboarding.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mariana.getId(), cursoOnboarding.getId()), mariana, cursoOnboarding,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s1)));
                enrollmentRepository.save(e);
            }

            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mario.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mario.getId(), cursoSeguridad.getId()), mario, cursoSeguridad,
                                new Date(ahora.getTime() - 40 * DAY), new Date(ahora.getTime() - (40 - 20) * DAY), "FINALIZADO", false, s4)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(camila.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(camila.getId(), cursoSeguridad.getId()), camila, cursoSeguridad,
                                new Date(ahora.getTime() - 19 * DAY), new Date(ahora.getTime() - (19 - 7) * DAY), "FINALIZADO", false, s4)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(sofia.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(sofia.getId(), cursoSeguridad.getId()), sofia, cursoSeguridad,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s3)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(juan.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(juan.getId(), cursoSeguridad.getId()), juan, cursoSeguridad,
                                new Date(ahora.getTime() - 32 * DAY), new Date(ahora.getTime() - (32 - 14) * DAY), "FINALIZADO", false, s4)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(luis.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(luis.getId(), cursoSeguridad.getId()), luis, cursoSeguridad,
                                new Date(ahora.getTime() - 25 * DAY), new Date(ahora.getTime() - (25 - 11) * DAY), "FINALIZADO", false, s4)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mariana.getId(), cursoSeguridad.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mariana.getId(), cursoSeguridad.getId()), mariana, cursoSeguridad,
                                new Date(ahora.getTime() - 18 * DAY), new Date(ahora.getTime() - (18 - 8) * DAY), "FINALIZADO", false, s4)));
                enrollmentRepository.save(e);
            }

            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mario.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mario.getId(), cursoComunicacion.getId()), mario, cursoComunicacion,
                                new Date(ahora.getTime() - 12 * DAY), new Date(ahora.getTime() - (12 - 5) * DAY), "FINALIZADO", false, s8)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(camila.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(camila.getId(), cursoComunicacion.getId()), camila, cursoComunicacion,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s7)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(sofia.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(sofia.getId(), cursoComunicacion.getId()), sofia, cursoComunicacion,
                                new Date(ahora.getTime() - 24 * DAY), new Date(ahora.getTime() - (24 - 11) * DAY), "FINALIZADO", false, s8)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(juan.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(juan.getId(), cursoComunicacion.getId()), juan, cursoComunicacion,
                                new Date(ahora.getTime() - 33 * DAY), new Date(ahora.getTime() - (33 - 16) * DAY), "FINALIZADO", false, s8)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(luis.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(luis.getId(), cursoComunicacion.getId()), luis, cursoComunicacion,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s7)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mariana.getId(), cursoComunicacion.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mariana.getId(), cursoComunicacion.getId()), mariana, cursoComunicacion,
                                new Date(ahora.getTime() - 21 * DAY), new Date(ahora.getTime() - (21 - 9) * DAY), "FINALIZADO", false, s8)));
                enrollmentRepository.save(e);
            }

            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(camila.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(camila.getId(), cursoCultura.getId()), camila, cursoCultura,
                                new Date(ahora.getTime() - 15 * DAY), new Date(ahora.getTime() - (15 - 6) * DAY), "FINALIZADO", false, s10)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(luis.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(luis.getId(), cursoCultura.getId()), luis, cursoCultura,
                                new Date(ahora.getTime() - 23 * DAY), new Date(ahora.getTime() - (23 - 10) * DAY), "FINALIZADO", false, s10)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mario.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mario.getId(), cursoCultura.getId()), mario, cursoCultura,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s9)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(mariana.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(mariana.getId(), cursoCultura.getId()), mariana, cursoCultura,
                                new Date(ahora.getTime() - 26 * DAY), new Date(ahora.getTime() - (26 - 13) * DAY), "FINALIZADO", false, s10)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(sofia.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(sofia.getId(), cursoCultura.getId()), sofia, cursoCultura,
                                new Date(ahora.getTime() - 22 * DAY), new Date(ahora.getTime() - (22 - 9) * DAY), "FINALIZADO", false, s10)));
                enrollmentRepository.save(e);
            }
            {
                Enrollment e = enrollmentRepository.findByUserIdAndCourseId(juan.getId(), cursoCultura.getId())
                        .orElseGet(() -> enrollmentRepository.save(new Enrollment(
                                new EnrollmentId(juan.getId(), cursoCultura.getId()), juan, cursoCultura,
                                new Date(ahora.getTime() - 14 * DAY), null, "ASIGNADO", false, s9)));
                enrollmentRepository.save(e);
            }
        }
        // ===================== FIN SEED MÉTRICAS =====================
    }
}
