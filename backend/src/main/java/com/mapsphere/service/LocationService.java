package com.mapsphere.service;

import com.mapsphere.entity.LocationShareSession;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.LocationShareSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class LocationService {

    private final LocationShareSessionRepository sessionRepository;

    public LocationService(LocationShareSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public Map<String, Object> createShareSession(User user) {
        String shareId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(2);

        LocationShareSession session = LocationShareSession.builder()
                .shareId(shareId)
                .user(user)
                .expiresAt(expiresAt)
                .active(true)
                .build();

        sessionRepository.save(session);

        return Map.of(
                "shareId", shareId,
                "expiresAt", expiresAt.toString(),
                "trackingUrl", "/share/" + shareId
        );
    }

    public LocationShareSession getSession(String shareId) {
        LocationShareSession session = sessionRepository.findByShareIdAndActiveTrue(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Live tracking session not found or expired"));

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            session.setActive(false);
            sessionRepository.save(session);
            throw new ResourceNotFoundException("This live tracking link has expired.");
        }

        return session;
    }

    @Transactional
    public void recordLocationUpdate(String shareId, double lat, double lng, Double accuracy, Double heading, Double speed) {
        sessionRepository.findByShareIdAndActiveTrue(shareId).ifPresent(session -> {
            if (session.getExpiresAt().isAfter(LocalDateTime.now())) {
                session.setLastLat(lat);
                session.setLastLng(lng);
                session.setLastAccuracy(accuracy);
                session.setLastHeading(heading);
                session.setLastSpeed(speed);
                session.setLastUpdate(LocalDateTime.now());
                sessionRepository.save(session);
            }
        });
    }

    @Transactional
    public void stopShareSession(String shareId, User user) {
        sessionRepository.findByShareId(shareId).ifPresent(session -> {
            if (session.getUser().getId().equals(user.getId())) {
                session.setActive(false);
                sessionRepository.save(session);
            }
        });
    }
}
