package com.mapsphere.service;

import com.mapsphere.dto.location.LiveLocationUpdate;
import com.mapsphere.dto.location.ShareLocationResponse;
import com.mapsphere.entity.LiveLocationSession;
import com.mapsphere.entity.User;
import com.mapsphere.exception.BadRequestException;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.LiveLocationSessionRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class LocationService {

    private final LiveLocationSessionRepository sessionRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public LocationService(LiveLocationSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public ShareLocationResponse createShareSession(User user, int durationMinutes) {
        int duration = durationMinutes > 0 && durationMinutes <= 1440 ? durationMinutes : 60; // Max 24h
        String shareId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        LiveLocationSession session = LiveLocationSession.builder()
                .user(user)
                .shareId(shareId)
                .active(true)
                .expiresAt(LocalDateTime.now().plusMinutes(duration))
                .build();

        LiveLocationSession saved = sessionRepository.save(session);

        return ShareLocationResponse.builder()
                .shareId(saved.getShareId())
                .expiresAt(saved.getExpiresAt())
                .active(saved.isActive())
                .build();
    }

    public ShareLocationResponse getSession(String shareId) {
        LiveLocationSession session = sessionRepository.findByShareId(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Live location session not found"));

        if (!session.isActive() || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Live location session has expired or been terminated");
        }

        ShareLocationResponse.ShareLocationResponseBuilder builder = ShareLocationResponse.builder()
                .shareId(session.getShareId())
                .expiresAt(session.getExpiresAt())
                .active(session.isActive())
                .accuracy(session.getAccuracy())
                .heading(session.getHeading())
                .speed(session.getSpeed());

        if (session.getLocation() != null) {
            builder.lastLatitude(session.getLocation().getY());
            builder.lastLongitude(session.getLocation().getX());
        }

        return builder.build();
    }

    @Transactional
    public void stopSession(String shareId, User user) {
        LiveLocationSession session = sessionRepository.findByShareId(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Live location session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to stop this session");
        }

        session.setActive(false);
        sessionRepository.save(session);
    }

    @Transactional
    public LiveLocationUpdate updateLocation(LiveLocationUpdate update) {
        LiveLocationSession session = sessionRepository.findByShareId(update.getShareId())
                .orElse(null);

        if (session != null && session.isActive() && session.getExpiresAt().isAfter(LocalDateTime.now())) {
            Point point = geometryFactory.createPoint(new Coordinate(update.getLongitude(), update.getLatitude()));
            session.setLocation(point);
            session.setAccuracy(update.getAccuracy());
            session.setHeading(update.getHeading());
            session.setSpeed(update.getSpeed());
            sessionRepository.save(session);
        }

        if (update.getTimestamp() == null) {
            update.setTimestamp(System.currentTimeMillis());
        }

        return update;
    }
}
