package org.onboardme.dao.repositories;

import org.onboardme.dao.entities.SectionContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionContentRepository extends JpaRepository<SectionContent, Long> {}
