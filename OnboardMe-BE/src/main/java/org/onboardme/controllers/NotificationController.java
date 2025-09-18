package org.onboardme.controllers;

import com.onboardme.api.NotificationsApi;
import com.onboardme.api.UsersApi;
import com.onboardme.model.NotificationDTO;
import org.onboardme.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class NotificationController implements NotificationsApi {

    @Autowired
    NotificationService notificationService;

    @Override
    public ResponseEntity<List<NotificationDTO>> getNotificationsByUser(Long idUser) {
        List<NotificationDTO> notifications = notificationService.getNotificationsByUser(idUser);
        return ResponseEntity.ok(notifications);
    }

    @Override
    public ResponseEntity<NotificationDTO> markNotificationAsRead(Long idNotification) {
        NotificationDTO updated = notificationService.markNotificationAsRead(idNotification);
        return ResponseEntity.ok(updated);
    }
}
