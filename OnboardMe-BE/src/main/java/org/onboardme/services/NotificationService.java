package org.onboardme.services;

import com.onboardme.model.NotificationDTO;
import jakarta.persistence.EntityNotFoundException;
import org.onboardme.dao.entities.Notification;
import org.onboardme.dao.repositories.NotificationRepository;
import org.onboardme.transformers.NotificationTransformer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    NotificationTransformer notificationTransformer;

    public List<NotificationDTO> getNotificationsByUser(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);

        return notifications.stream()
                .map(notificationTransformer::buildNotificationResponse)
                .collect(Collectors.toList());
    }

    public NotificationDTO markNotificationAsRead(Long idNotification) {
        Notification notification = notificationRepository.findById(idNotification);

        notification.setSeen(true);
        notificationRepository.save(notification);

        return notificationTransformer.buildNotificationResponse(notification);
    }
}
