package org.onboardme.dao.repositories;

import com.onboardme.model.BuddyCoverageDTO;
import org.onboardme.dao.entities.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findById(Long id);
    Optional<User> findByEmail(String email);
    List<User> findByBuddyId(Long idBuddy);

    @Query("""
    SELECT new com.onboardme.model.BuddyCoverageDTO(
      100.0 * SUM(CASE WHEN u.buddy IS NOT NULL THEN 1 ELSE 0 END) / COUNT(u),
      SUM(CASE WHEN u.buddy IS NOT NULL THEN 1 ELSE 0 END) * 1.0 / COUNT(DISTINCT u.buddy)
    )
    FROM User u
  """)
    BuddyCoverageDTO findBuddyCoverage();

}
