package org.onboardme.dao.repositories;

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

}
