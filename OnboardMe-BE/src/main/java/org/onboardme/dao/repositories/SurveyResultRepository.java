package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.content.ExamResult;
import org.onboardme.dao.entities.content.SurveyResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SurveyResultRepository extends JpaRepository<SurveyResult, Long> {

    @Query("SELECT r FROM SurveyResult r WHERE r.user.id = :userId AND r.survey.id_content = :surveyId")
    Optional<SurveyResult> findByUserAndSurvey(@Param("userId") Long userId, @Param("surveyId") Long surveyId);
}