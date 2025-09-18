package org.onboardme.transformers;

import com.onboardme.model.NotificationDTO;
import org.onboardme.dao.entities.Notification;
import org.onboardme.dao.entities.User;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

@Component
public class NotificationTransformer {

    private final UserTransformer userTransformer;

    public NotificationTransformer(UserTransformer userTransformer) {
        this.userTransformer = userTransformer;
    }

    public NotificationDTO buildNotificationResponse(Notification notification) {
        return buildNotificationResponse(notification, new HashSet<>());
    }

    private NotificationDTO buildNotificationResponse(Notification notification, Set<Long> visitedIds) {
        if (notification == null) return null;

        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());

        User user = notification.getUser();
        if (user != null) {
            dto.setIdUser(user.getId());
            // dto.setUser(userTransformer.buildUserResponse(user, visitedIds));
        }

        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());

        if (notification.getSentDate() != null) {
            dto.setSentDate(notification.getSentDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }

        dto.setSeen(notification.getSeen());

        return dto;
    }
}
