package org.onboardme.transformers;

import com.onboardme.model.NotificationDTO;
import org.onboardme.dao.entities.Notification;
import org.onboardme.dao.entities.User;
import org.onboardme.dao.repositories.UserRepository;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.Date;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Component
public class NotificationTransformer {

    private final UserRepository userRepository;

    public NotificationTransformer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public NotificationDTO buildNotificationResponse(Notification notification) {
        return buildNotificationResponse(notification, new HashSet<>());
    }

    public Notification buildNotificationEntityResponse(NotificationDTO notification) {
        return buildNotificationEntityDAOResponse(notification);
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

    private Notification buildNotificationEntityDAOResponse(NotificationDTO notificationDto) {
        if (notificationDto == null) return null;

        Notification notification = new Notification();
        notification.setId(notification.getId());
        notification.setTitle(notificationDto.getTitle());
        notification.setMessage(notificationDto.getMessage());

        User user = userRepository.findById(notificationDto.getIdUser()).get();
        if (Objects.nonNull(user)) {
            notification.setUser(user);
            // dto.setUser(userTransformer.buildUserResponse(user, visitedIds));
        }

        if (notification.getSentDate() != null) {            // or however you get it
            ZoneId zone = ZoneId.of("America/Argentina/Buenos_Aires"); // pick the right zone

            Date date = Date.from(notificationDto.getSentDate().atStartOfDay(zone).toInstant());
            notification.setSentDate(date);
        }

        notification.setSeen(notification.getSeen());

        return notification;
    }


}
