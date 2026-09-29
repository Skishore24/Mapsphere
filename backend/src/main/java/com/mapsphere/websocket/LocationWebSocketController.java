package com.mapsphere.websocket;

import com.mapsphere.service.LocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class LocationWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(LocationWebSocketController.class);

    private final LocationBroker locationBroker;
    private final LocationService locationService;

    // Rate limiter: Max 5 updates per second per shareId
    private final Map<String, Long> lastUpdatePerSession = new ConcurrentHashMap<>();

    public LocationWebSocketController(LocationBroker locationBroker, LocationService locationService) {
        this.locationBroker = locationBroker;
        this.locationService = locationService;
    }

    @MessageMapping("/location.update")
    public void handleLocationUpdate(@Payload LocationMessage message) {
        if (message.getShareId() == null || message.getShareId().isBlank()) {
            return;
        }

        // Validate coordinates
        if (message.getLatitude() < -90 || message.getLatitude() > 90 ||
            message.getLongitude() < -180 || message.getLongitude() > 180) {
            log.warn("Invalid coordinates discarded in websocket update: lat={}, lng={}",
                    message.getLatitude(), message.getLongitude());
            return;
        }

        // Rate limiting: Ignore updates received within 150ms of the previous update for same session
        long now = System.currentTimeMillis();
        Long lastTime = lastUpdatePerSession.get(message.getShareId());
        if (lastTime != null && (now - lastTime < 150)) {
            return;
        }
        lastUpdatePerSession.put(message.getShareId(), now);

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now().toString());
        }

        // Persist the latest coordinate in database
        try {
            locationService.recordLocationUpdate(
                    message.getShareId(),
                    message.getLatitude(),
                    message.getLongitude(),
                    message.getAccuracy(),
                    message.getHeading(),
                    message.getSpeed()
            );
        } catch (Exception e) {
            log.warn("Failed to persist location update for session {}: {}", message.getShareId(), e.getMessage());
        }

        // Broadcast to all viewers subscribed to this specific session topic
        locationBroker.broadcastLocation(message.getShareId(), message);
    }
}
