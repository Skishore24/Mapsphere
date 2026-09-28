package com.mapsphere.repository;

import com.mapsphere.entity.LocationShareSession;
import com.mapsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationShareSessionRepository extends JpaRepository<LocationShareSession, Long> {
    Optional<LocationShareSession> findByShareIdAndActiveTrue(String shareId);
    Optional<LocationShareSession> findByShareId(String shareId);
    List<LocationShareSession> findByUserAndActiveTrue(User user);
    long countByActiveTrueAndExpiresAtAfter(LocalDateTime now);
}
