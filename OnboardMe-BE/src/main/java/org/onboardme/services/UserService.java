package org.onboardme.services;

import com.onboardme.model.*;
import jakarta.persistence.EntityNotFoundException;
import org.onboardme.dao.entities.Notification;
import org.onboardme.dao.entities.Role;
import org.onboardme.dao.repositories.NotificationRepository;
import org.onboardme.dao.repositories.RoleRepository;
import org.onboardme.exceptions.OnboardMeException;
import org.onboardme.transformers.UserTransformer;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserTransformer userTransformer;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    EmailService emailService;

    @Autowired
    PasswordService passwordService;

    public UserDetailsService userDetailsService() {
        return username -> {
            Optional<User> optionalUser = userRepository.findByEmail(username);

            User user = optionalUser.orElseThrow(() ->
                    new UsernameNotFoundException("Usuario no encontrado con email: " + username));

            Role role = user.getRole();

            GrantedAuthority authority = new SimpleGrantedAuthority(role.getName());

            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password(user.getPassword())
                    .authorities(List.of(authority))
                    .build();
        };
    }

    public List<UserDTO> getUsers() {

        List<User> users = userRepository.findAll();

        return users.stream().map(user -> userTransformer.buildUserResponse(user)).toList();
    }

    public UserDTO getUser(Long id) {

        User user = userRepository.findById(id).get();

        return userTransformer.buildUserResponse(user);
    }

    public UserDTO assignBuddy(Long userId, Long buddyId){
        User user = userRepository.findById(userId).get();
        Optional<User> buddy = userRepository.findById(buddyId);

        if(buddy.isPresent()){
            user.setBuddy(buddy.get());
            userRepository.save(user);
        } else {
            throw new RuntimeException();
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("NUEVO BUDDY ASIGNADO");
        notification.setMessage("Hola, " + user.getFirstName() + " " + user.getLastName() + " se te ha asignado un nuevo buddy: " + buddy.get().getFirstName() + " " + buddy.get().getLastName()
                + ", " + "el te asignará cursos y guiará en el proceso inicial.");
        notification.setSentDate(new Date());
        notification.setSeen(false);

        notificationRepository.save(notification);

        Notification notificationBuddy = new Notification();
        notificationBuddy.setUser(buddy.get());
        notificationBuddy.setTitle("NUEVO EMPLEADO ASIGNADO");
        notificationBuddy.setMessage("Hola, " + buddy.get().getFirstName() + " " + buddy.get().getLastName() + " se te ha asignado un nuevo empleado: " + user.getFirstName() + " " + user.getLastName()
                + ", " + "ya podes asignarle cursos y guiarlo en su proceso inicial.");
        notificationBuddy.setSentDate(new Date());
        notificationBuddy.setSeen(false);

        notificationRepository.save(notificationBuddy);

        return userTransformer.buildUserResponse(user);
    }

    public List<UserDTO> getUsersByBuddy(Long idBuddy) {
        List<User> users = userRepository.findByBuddyId(idBuddy);
        return users.stream().map(user -> userTransformer.buildUserResponse(user)).toList();
    }

    public void changePassword(Long idUser, ChangePasswordRequestDTO request) throws OnboardMeException {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new OnboardMeException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
        }

        User user = userRepository.findById(idUser)
                .orElseThrow(() -> new OnboardMeException(HttpStatus.BAD_REQUEST, "El usuario no existe."));

        String hashed = passwordService.hashPassword(request.getNewPassword());
        user.setPassword(hashed);
        userRepository.save(user);

        emailService.sendChangePasswordEmail(
                user.getEmail(),
                user.getFirstName()
        );
    }

    public void resetPassword(String email, ChangePasswordRequestDTO request) throws OnboardMeException {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new OnboardMeException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new OnboardMeException(HttpStatus.BAD_REQUEST, "El mail ingresado no existe en la plataforma."));

        String hashed = passwordService.hashPassword(request.getNewPassword());
        user.setPassword(hashed);
        userRepository.save(user);

        emailService.sendResetPasswordEmail(
                user.getEmail(),
                user.getFirstName()
        );
    }

    public UserDTO createUser(UserDTO userDTO) throws OnboardMeException {
        // Validar que el mail no exista
        if (userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
            throw new OnboardMeException(HttpStatus.UNAUTHORIZED, "El usuario con email " + userDTO.getEmail() + " ya existe en la plataforma.");
        }

        String generatedPassword = passwordService.generateRandomPassword();

        User user = new User();
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordService.hashPassword(generatedPassword));
        user.setArea(userDTO.getArea());
        user.setAddress(userDTO.getAddress());
        user.setPhone(userDTO.getPhone());
        user.setBuddy(null);
        if (userDTO.getBirthDate() != null) {
            Date birthDate = Date.from(userDTO.getBirthDate()
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant());
            user.setBirthDate(birthDate);
        }
        user.setCreatedDate(new Date());
        user.setStatus(1);

        if (userDTO.getRole() != null && userDTO.getRole().getName() != null) {
            Role role = roleRepository.findByName(userDTO.getRole().getName())
                    .orElseThrow(() -> new OnboardMeException(HttpStatus.UNAUTHORIZED, "Rol no encontrado: " + userDTO.getRole().getName()));
            user.setRole(role);
        }

        User saved = userRepository.save(user);

        emailService.sendUserCreationEmail(
                user.getEmail(),
                user.getFirstName(),
                user.getEmail(),
                generatedPassword
        );

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("BIENVENIDA");
        notification.setMessage("Hola, " + user.getFirstName() + " " + user.getLastName() + " bienvenido a OnboardMe! Recordá dirigirte a tu perfil y actualizar la contraseña a la brevedad.");
        notification.setSentDate(new Date());
        notification.setSeen(false);

        notificationRepository.save(notification);

        new UserDTO();
        UserDTO result;
        result = userTransformer.buildUserResponse(saved);

        return result;
    }

    @Async
    public void processUsersCsv(MultipartFile file, Long idUser) {
        int totalRecords = 0;
        int created = 0;
        int failed = 0;
        List<String> messages = new ArrayList<>(); // ahora contiene todo, errores y éxitos

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }

                totalRecords++;
                String[] columns = line.split(",");

                String firstName = null;
                String lastName = null;
                String email = null;

                try {
                    firstName = columns[0].trim();
                    lastName = columns[1].trim();
                    email = columns[2].trim();
                    String password = passwordService.generateRandomPassword();
                    String roleName = columns[3].trim();
                    String areaName = columns[4].trim();
                    String address = columns[5].trim();
                    String phone = columns[6].trim();

                    Date birthDate;
                    try {
                        SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy");
                        birthDate = formatter.parse(columns[7].trim());
                    } catch (Exception e) {
                        throw new IllegalArgumentException("Formato de fecha inválido en línea " + totalRecords + ": " + columns[8]);
                    }

                    if (userRepository.findByEmail(email).isPresent()) {
                        throw new IllegalArgumentException("El usuario con email " + email + " ya fue dado de alta en la plataforma.");
                    }

                    int finalTotalRecords = totalRecords;
                    Role role = roleRepository.findByName(roleName)
                            .orElseThrow(() -> new IllegalArgumentException("El rol ingresado no es válido en la línea " + finalTotalRecords + ": " + roleName));

                    User user = new User();
                    user.setFirstName(firstName);
                    user.setLastName(lastName);
                    user.setEmail(email);
                    user.setPassword(passwordService.hashPassword(password));
                    user.setArea(areaName);
                    user.setStatus(1);
                    user.setRole(role);
                    user.setBuddy(null);
                    user.setCreatedDate(new Date());
                    user.setAddress(address);
                    user.setPhone(phone);
                    user.setBirthDate(birthDate);
                    userRepository.save(user);

                    emailService.sendUserCreationEmail(email, firstName, email, password);

                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle("BIENVENIDA");
                    notification.setMessage("Hola, " + user.getFirstName() + " " + user.getLastName() + " bienvenido a OnboardMe! Recordá dirigirte a tu perfil y actualizar la contraseña a la brevedad.");
                    notification.setSentDate(new Date());
                    notification.setSeen(false);
                    notificationRepository.save(notification);

                    created++;
                    // mensaje de éxito
                    messages.add("Usuario " + firstName + " " + lastName + " fue dado de alta en la plataforma con éxito.");
                } catch (Exception e) {
                    failed++;
                    String personInfo = (firstName != null || lastName != null)
                            ? (" | Usuario: " + (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : ""))
                            : "";
                    messages.add("Error en línea " + totalRecords + personInfo + " -> " + e.getMessage());
                }
            }
        } catch (Exception e) {
            messages.add("Error crítico al procesar el archivo: " + e.getMessage());
        }

        User currentUser = userRepository.findById(idUser).orElse(null);

        StringBuilder summary = new StringBuilder();
        summary.append("Procesamiento masivo finalizado.\n");
        summary.append("Total de registros: ").append(totalRecords)
                .append("  Creados exitosamente: ").append(created)
                .append("  Fallidos: ").append(failed).append("\n\n");

        if (!messages.isEmpty()) {
            summary.append("Detalles:\n");
            for (String msg : messages) {
                summary.append("• ").append(msg).append("\n");
            }
        }

        if (currentUser != null) {
            Notification logNotification = new Notification();
            logNotification.setUser(currentUser);
            logNotification.setTitle("Resultado del procesamiento masivo de usuarios");
            logNotification.setMessage(summary.toString());
            logNotification.setSentDate(new Date());
            logNotification.setSeen(false);
            notificationRepository.save(logNotification);
        } else {
            System.err.println("No se encontró el usuario que inició el procesamiento. Mensajes acumulados:\n" + summary);
        }
    }

    public Page<UserRepository.EmployeeOverviewRow> getEmployeesOverview(String search, int page, int size) {
        int effectiveSize = Math.min(Math.max(size, 1), 100);
        int offset = page * effectiveSize;
        String normalized = (search == null || search.isBlank()) ? null : search.trim();

        List<UserRepository.EmployeeOverviewRow> rows =
                userRepository.findEmployeesOverview(normalized, effectiveSize, offset);
        long total = userRepository.countEmployeesOverview(normalized);

        return new PageImpl<>(rows, PageRequest.of(page, effectiveSize), total);
    }

    public AssignBuddyBulkResponseDTO assignBuddyBulk(Long buddyId, List<Long> userIds) {
        AssignBuddyBulkResponseDTO out = new AssignBuddyBulkResponseDTO()
                .assigned(new ArrayList<>())
                .skippedAlreadyAssigned(new ArrayList<>())
                .skippedSelfAssignment(new ArrayList<>())
                .notFound(new ArrayList<>());

        User buddy = userRepository.findById(buddyId.intValue())
                .orElseThrow(() -> new OnboardMeException(HttpStatus.BAD_REQUEST, "Buddy no encontrado"));

        List<User> users = userRepository.findAllById(
                userIds.stream().map(Long::intValue).toList()
        );

        Set<Long> foundIds = users.stream().map(User::getId).collect(Collectors.toSet());

        userIds.forEach(id -> {
            if (!foundIds.contains(id)) out.getNotFound().add(id);
        });

        for (User u : users) {
            // evitar auto-asignación
            if (Objects.equals(u.getId(), buddy.getId())) {
                out.getSkippedSelfAssignment().add(u.getId());
                continue;
            }

            // si ya tiene ese buddy asignado, saltear
            Long currentBuddyId = (u.getBuddy() != null) ? u.getBuddy().getId() : null;
            if (currentBuddyId != null && currentBuddyId.equals(buddy.getId())) {
                out.getSkippedAlreadyAssigned().add(u.getId());
                continue;
            }

            // asignar relación
            u.setBuddy(buddy);
            out.getAssigned().add(u.getId());

            Notification notificationEmpleado = new Notification();
            notificationEmpleado.setUser(u);
            notificationEmpleado.setTitle("NUEVO BUDDY ASIGNADO");
            notificationEmpleado.setMessage("Hola, " + u.getFirstName() + " " + u.getLastName() + " se te ha asignado un nuevo buddy: " + buddy.getFirstName() + " " + buddy.getLastName()
                    + ", " + "el te asignará cursos y guiará en el proceso inicial.");
            notificationEmpleado.setSentDate(new Date());
            notificationEmpleado.setSeen(false);

            notificationRepository.save(notificationEmpleado);

            Notification notificationBuddy = new Notification();
            notificationBuddy.setUser(buddy);
            notificationBuddy.setTitle("NUEVO EMPLEADO ASIGNADO");
            notificationBuddy.setMessage("Hola, " + buddy.getFirstName() + " " + buddy.getLastName() + " se te ha asignado un nuevo empleado: " + u.getFirstName() + " " + u.getLastName()
                    + ", " + "ya podes asignarle cursos y guiarlo en su proceso inicial.");
            notificationBuddy.setSentDate(new Date());
            notificationBuddy.setSeen(false);

            notificationRepository.save(notificationBuddy);
        }

        userRepository.saveAll(users);

        return out;
    }

    public UserRepository.EmployeeOverviewRow getOverviewRowByUserId(Long userId) {
        return userRepository.findOverviewByUserId(userId);
    }

    public EmployeeOverviewDTO toEmployeeOverviewDTO(UserRepository.EmployeeOverviewRow row) {
        if (row == null) return null;
        EmployeeOverviewDTO dto = new EmployeeOverviewDTO();
        dto.setUserId(row.getUserId());
        dto.setFirstName(row.getFirstName());
        dto.setLastName(row.getLastName());
        dto.setEmail(row.getEmail());
        dto.setRoleName(row.getRoleName());
        dto.setBuddyFullName(row.getBuddyFullName());
        dto.setCoursesCount(row.getCoursesCount());
        dto.setAvgProgress(row.getAvgProgress() == null ? null : row.getAvgProgress().floatValue());
        return dto;
    }
}
