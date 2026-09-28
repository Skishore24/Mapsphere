package com.mapsphere.repository;

import com.mapsphere.entity.LiveLocationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LiveLocationSessionRepository extends JpaRepository<LiveLocationSession, Long> {
    Optional<LiveLocationSession> findByShareId(String shareId);
}
