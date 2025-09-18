package org.onboardme.controllers;

import com.onboardme.api.UsersApi;
import com.onboardme.model.UploadUsersCsv200Response;
import com.onboardme.model.UserDTO;
import org.onboardme.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<UploadUsersCsv200Response> uploadUsersCsv(MultipartFile file) {
        UploadUsersCsv200Response response = userService.processUsersCsv(file);
        return ResponseEntity.ok(response);
    }

}
