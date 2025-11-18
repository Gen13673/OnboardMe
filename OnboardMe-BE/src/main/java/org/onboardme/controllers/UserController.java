package org.onboardme.controllers;

import com.onboardme.api.UsersApi;
import com.onboardme.model.*;
import org.onboardme.dao.repositories.UserRepository;
import org.onboardme.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Parameter;

import java.util.List;

@RestController
public class UserController implements UsersApi {

    @Autowired
    UserService userService;

    @Override
    public ResponseEntity<List<UserDTO>> getUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }

    @Override
    public ResponseEntity<UserDTO> getUser(Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @Override
    public ResponseEntity<UserDTO> assignBuddy(Long idUser, Long id) {
        return ResponseEntity.ok(userService.assignBuddy(idUser, id));
    }

    @Override
    public ResponseEntity<List<UserDTO>> getUsersByBuddy(Long idBuddy) {
        return ResponseEntity.ok(userService.getUsersByBuddy(idBuddy));
    }

    @Override
    public ResponseEntity<UploadUsersCsv200Response> uploadUsersCsv(Long idUser, MultipartFile file) {
        userService.processUsersCsv(file, idUser);

        UploadUsersCsv200Response response = new UploadUsersCsv200Response();
        response.setTotalRecords(0);
        response.setCreated(0);
        response.setFailed(0);
        response.setErrors(List.of("Procesamiento iniciado. Serás notificado al finalizar."));

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<UserDTO> createUser(UserDTO user) {
        UserDTO created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Override
    public ResponseEntity<EmployeesOverviewPageDTO> getUsersOverview(
            @Parameter(name = "search") String search,
            @Parameter(name = "page") Integer page,
            @Parameter(name = "size") Integer size) {

        Page<UserRepository.EmployeeOverviewRow> p =
                userService.getEmployeesOverview(search, page != null ? page : 0, size != null ? size : 50);

        EmployeesOverviewPageDTO dto = new EmployeesOverviewPageDTO();

        List<EmployeeOverviewDTO> content = p.getContent().stream().map(row -> {
            EmployeeOverviewDTO r = new EmployeeOverviewDTO();
            r.setUserId(row.getUserId());
            r.setFirstName(row.getFirstName());
            r.setLastName(row.getLastName());
            r.setEmail(row.getEmail());
            r.setRoleName(row.getRoleName());
            r.setBuddyFullName(row.getBuddyFullName());
            r.setCoursesCount(row.getCoursesCount());
            r.setAvgProgress(
                    row.getAvgProgress() == null ? null : row.getAvgProgress().floatValue()
            );
            return r;
        }).toList();

        dto.setContent(content);
        dto.setNumber(p.getNumber());
        dto.setSize(p.getSize());
        dto.setTotalElements(p.getTotalElements());
        dto.setTotalPages(p.getTotalPages());
        dto.setFirst(p.isFirst());
        dto.setLast(p.isLast());
        dto.setNumberOfElements(p.getNumberOfElements());
        dto.setEmpty(p.isEmpty());

        return ResponseEntity.ok(dto);
    }

    @Override
    public ResponseEntity<AssignBuddyBulkResponseDTO> assignBuddyBulk(AssignBuddyBulkRequestDTO body) {
        AssignBuddyBulkResponseDTO res = userService.assignBuddyBulk(body.getBuddyId(), body.getUserIds());
        return ResponseEntity.ok(res);
    }

    @Override
    public ResponseEntity<ChangePassword200Response> changePassword(Long idUser, ChangePasswordRequestDTO request) {
        userService.changePassword(idUser, request);
        ChangePassword200Response response = new ChangePassword200Response();
        response.setMessage("Contraseña actualizada con éxito.");
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<ResetPassword200Response> resetPassword(String email, ChangePasswordRequestDTO request) {
        userService.resetPassword(email, request);
        ResetPassword200Response response = new ResetPassword200Response();
        response.setMessage("Contraseña actualizada con éxito.");
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<EmployeeOverviewDTO> getUserOverview(Long idUser) {
        var row = userService.getOverviewRowByUserId(idUser);
        if (row == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(userService.toEmployeeOverviewDTO(row));
    }

}
