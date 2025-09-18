package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.content.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {

    @Query("SELECT r FROM ExamResult r WHERE r.user.id = :userId AND r.exam.id_content = :examId")
    Optional<ExamResult> findByUserAndExam(@Param("userId") Long userId, @Param("examId") Long examId);
}