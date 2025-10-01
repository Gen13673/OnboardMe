package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.Course;
import org.onboardme.dao.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    Optional<Course> findByTitle(String title);

    Course findById(Long userId);
}
