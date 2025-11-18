package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findById(Long id);
    Optional<User> findByEmail(String email);
    List<User> findByBuddyId(Long idBuddy);

    public interface EmployeeOverviewRow {
        Long getUserId();
        String getFirstName();
        String getLastName();
        String getEmail();
        String getRoleName();
        String getBuddyFullName();
        Integer getCoursesCount();
        Double getAvgProgress();
    }

    @Query(value = """
  SELECT
    u.Id_Legajo AS userId,
    u.Nombre AS firstName,
    u.Apellido AS lastName,
    u.Email AS email,
    r.Nombre AS roleName,
    CONCAT(COALESCE(b.Nombre,''),' ',COALESCE(b.Apellido,'')) AS buddyFullName,
    COUNT(e.Id_Usuario) AS coursesCount,
    COALESCE(AVG(
      CASE
        WHEN sc.total_sections > 0 THEN
          CEIL( (COALESCE(s.Orden, 0) * 1000.0) / sc.total_sections ) / 10.0
        ELSE 0
      END
    ), 0) AS avgProgress
  FROM usuario u
  LEFT JOIN rol r               ON r.Id = u.Id_Rol
  LEFT JOIN usuario b           ON b.Id_Legajo = u.buddy_id
  LEFT JOIN usuario_x_curso e   ON e.Id_Usuario = u.Id_Legajo
  LEFT JOIN seccion s           ON s.Id = e.Id_Seccion
  LEFT JOIN (
     SELECT Id_Curso, COUNT(*) AS total_sections
     FROM seccion
     GROUP BY Id_Curso
  ) sc ON sc.Id_Curso = e.Id_Curso
  WHERE (:search IS NULL
     OR u.Nombre   LIKE CONCAT('%', :search, '%')
     OR u.Apellido LIKE CONCAT('%', :search, '%')
     OR u.Email    LIKE CONCAT('%', :search, '%'))
  GROUP BY u.Id_Legajo
  ORDER BY u.Nombre, u.Apellido
  LIMIT :limit OFFSET :offset
""", nativeQuery = true)
    List<EmployeeOverviewRow> findEmployeesOverview(
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query(value = """
  SELECT COUNT(*)
  FROM usuario u
  WHERE (:search IS NULL
     OR u.Nombre   LIKE CONCAT('%', :search, '%')
     OR u.Apellido LIKE CONCAT('%', :search, '%')
     OR u.Email    LIKE CONCAT('%', :search, '%'))
""", nativeQuery = true)
    long countEmployeesOverview(@Param("search") String search);

    @Query(value = """
  SELECT
    u.Id_Legajo AS userId,
    u.Nombre AS firstName,
    u.Apellido AS lastName,
    u.Email AS email,
    r.Nombre AS roleName,
    CONCAT(COALESCE(b.Nombre,''),' ',COALESCE(b.Apellido,'')) AS buddyFullName,
    COUNT(e.Id_Usuario) AS coursesCount,
    COALESCE(AVG(
      CASE
        WHEN sc.total_sections > 0 THEN
          CEIL( (COALESCE(s.Orden, 0) * 1000.0) / sc.total_sections ) / 10.0
        ELSE 0
      END
    ), 0) AS avgProgress
  FROM usuario u
  LEFT JOIN rol r               ON r.Id = u.Id_Rol
  LEFT JOIN usuario b           ON b.Id_Legajo = u.buddy_id
  LEFT JOIN usuario_x_curso e   ON e.Id_Usuario = u.Id_Legajo
  LEFT JOIN seccion s           ON s.Id = e.Id_Seccion
  LEFT JOIN (
     SELECT Id_Curso, COUNT(*) AS total_sections
     FROM seccion
     GROUP BY Id_Curso
  ) sc ON sc.Id_Curso = e.Id_Curso
  WHERE u.Id_Legajo = :userId
  GROUP BY u.Id_Legajo, u.Nombre, u.Apellido, u.Email, r.Nombre, b.Nombre, b.Apellido
""", nativeQuery = true)
    UserRepository.EmployeeOverviewRow findOverviewByUserId(@Param("userId") Long userId);

}
