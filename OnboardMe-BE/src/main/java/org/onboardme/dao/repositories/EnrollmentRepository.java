package org.onboardme.dao.repositories;

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
