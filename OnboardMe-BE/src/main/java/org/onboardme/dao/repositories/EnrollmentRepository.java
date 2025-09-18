package org.onboardme.dao.repositories;

import com.onboardme.model.SectionDropoffDTO;
import com.onboardme.model.UserProgressDTO;
import org.onboardme.dao.entities.Enrollment;
import org.onboardme.dao.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Integer> {
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<Enrollment> findByUserIdAndFavoriteTrue(Long userId);

    @Query("""
    SELECT new com.onboardme.model.SectionDropoffDTO(
      s.id,
      s.title,
      CASE 
        WHEN COUNT(e) = 0 THEN 0.0 
        ELSE 100.0 * SUM(
               CASE WHEN e.finishedDate IS NULL THEN 1 ELSE 0 END
             ) / COUNT(e)
      END
    )
    FROM Section s
    LEFT JOIN s.enrollments e
      ON (:idBuddy IS NULL OR e.user.buddy.id = :idBuddy)
    GROUP BY s.id, s.title
  """)
    List<SectionDropoffDTO> findSectionDropoffRatesByBuddy(@Param("idBuddy") Long idBuddy);

    @Query("""
    SELECT new com.onboardme.model.UserProgressDTO(
      c.title,
      CASE WHEN e.finishedDate IS NOT NULL THEN 100.0 ELSE 0.0 END
    )
    FROM Enrollment e
    JOIN e.course c
    WHERE e.user.id = :idUser
  """)
    List<UserProgressDTO> findCourseProgressByUser(@Param("idUser") Long idUser);

    @Query("""
SELECT
  CONCAT(u.firstName, ' ', u.lastName) AS name,
  AVG( DATEDIFF(e.finishedDate, e.enrolledAt) ) AS avgDays
FROM Enrollment e
JOIN e.user u
WHERE e.course.id = :courseId
  AND e.finishedDate IS NOT NULL
  AND (:idBuddy IS NULL OR u.buddy.id = :idBuddy)
GROUP BY u.id, u.firstName, u.lastName
ORDER BY avgDays DESC
""")
    List<Object[]> findUserAvgCompletionTimeByCourseRaw(
            @Param("courseId") Long courseId,
            @Param("idBuddy") Long idBuddy
    );

    @Query("""
        SELECT e
        FROM Enrollment e
        JOIN e.user u
        WHERE e.course.id = :courseId
          AND (:idBuddy IS NULL OR u.buddy.id = :idBuddy)
    """)
    List<Enrollment> findByCourseAndOptionalBuddy(
            @Param("courseId") Long courseId,
            @Param("idBuddy") Long idBuddy
    );


}
