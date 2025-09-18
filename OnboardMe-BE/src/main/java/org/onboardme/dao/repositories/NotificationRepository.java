package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserId(Long userId);
    Notification findById(Long userId);
}
