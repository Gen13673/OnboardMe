package org.onboardme.services;

import com.onboardme.model.UploadUsersCsv200Response;
import com.onboardme.model.UserDTO;
import org.onboardme.dao.entities.Role;
import org.onboardme.dao.repositories.RoleRepository;
import org.onboardme.transformers.UserTransformer;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserTransformer userTransformer;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    EmailService emailService;

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

        return userTransformer.buildUserResponse(user);
    }

    public List<UserDTO> getUsersByBuddy(Long idBuddy) {
        List<User> users = userRepository.findByBuddyId(idBuddy);
        return users.stream().map(user -> userTransformer.buildUserResponse(user)).toList();
    }

    public UploadUsersCsv200Response processUsersCsv(MultipartFile file) {
        UploadUsersCsv200Response response = new UploadUsersCsv200Response();
        int totalRecords = 0;
        int created = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

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
                    String password = columns[3].trim();
                    String roleName = columns[4].trim();
                    String areaName = columns[5].trim();

                    // 🚨 Validación: Email ya existente
                    if (userRepository.findByEmail(email).isPresent()) {
                        throw new IllegalArgumentException("El usuario con email " + email + " ya existe en la plataforma");
                    }

                    User user = new User();
                    user.setFirstName(firstName);
                    user.setLastName(lastName);
                    user.setEmail(email);
                    user.setPassword(password);
                    user.setArea(areaName);
                    user.setStatus(1);

                    Role role = roleRepository.findByName(roleName)
                            .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + roleName));
                    user.setRole(role);
                    user.setBuddy(null);
                    user.setCreatedDate(new Date());
                    userRepository.save(user);

                    emailService.sendUserCreationEmail(
                            user.getEmail(),
                            user.getFirstName(),
                            user.getEmail(),
                            user.getPassword()
                    );

                    created++;
                } catch (Exception e) {
                    failed++;
                    String personInfo = (firstName != null || lastName != null)
                            ? (" | Usuario: " + (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : ""))
                            : "";
                    errors.add("Error en la línea " + totalRecords + personInfo + " -> " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al procesar el archivo: " + e.getMessage());
        }

        response.setTotalRecords(totalRecords);
        response.setCreated(created);
        response.setFailed(failed);
        response.setErrors(errors);

        return response;
    }
}
