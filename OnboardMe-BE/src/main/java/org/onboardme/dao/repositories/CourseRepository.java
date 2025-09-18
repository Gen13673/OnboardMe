package org.onboardme.dao.repositories;

import com.onboardme.model.CourseCompletionDTO;
import com.onboardme.model.TimeToCompleteDTO;
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

    @Query("""
    SELECT new com.onboardme.model.CourseCompletionDTO(
      c.id,
      c.title,
      CASE 
        WHEN COUNT(e) = 0 THEN 0.0 
        ELSE 100.0 * SUM(
               CASE WHEN e.finishedDate IS NOT NULL THEN 1 ELSE 0 END
             ) / COUNT(e)
      END
    )
    FROM Course c
    LEFT JOIN c.enrollments e
      ON (:idBuddy IS NULL OR e.user.buddy.id = :idBuddy)
    GROUP BY c.id, c.title
  """)
    List<CourseCompletionDTO> findCourseCompletionRatesByBuddy(@Param("idBuddy") Long idBuddy);

    @Query("""
    SELECT new com.onboardme.model.TimeToCompleteDTO(
      c.id,
      c.title,
      COALESCE(
        AVG(
          CAST(
            function('datediff', e.finishedDate, e.enrolledAt)
            AS double
          )
        ),
        0.0
      )
    )
    FROM Course c
    LEFT JOIN c.enrollments e
      ON (:idBuddy IS NULL OR e.user.buddy.id = :idBuddy)
    GROUP BY c.id, c.title
  """)
    List<TimeToCompleteDTO> findAvgCompletionTimesByBuddy(@Param("idBuddy") Long idBuddy);

    Course findById(Long userId);
}
