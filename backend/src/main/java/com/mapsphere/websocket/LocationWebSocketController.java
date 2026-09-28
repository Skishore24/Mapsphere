package com.mapsphere.websocket;

import com.mapsphere.service.LocationService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class LocationWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final LocationService locationService;

    public LocationWebSocketController(SimpMessagingTemplate messagingTemplate, LocationService locationService) {
        this.messagingTemplate = messagingTemplate;
        this.locationService = locationService;
    }

    @MessageMapping("/location.update")
    public void handleLocationUpdate(@Payload LocationMessage message) {
        if (message.getShareId() == null || message.getShareId().isBlank()) {
            return;
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now().toString());
        }

        // Persist the latest coordinate
        locationService.recordLocationUpdate(
                message.getShareId(),
                message.getLatitude(),
                message.getLongitude(),
                message.getAccuracy(),
                message.getHeading(),
                message.getSpeed()
        );

        // Broadcast to all viewers subscribed to this specific session topic
        messagingTemplate.convertAndSend("/topic/location/" + message.getShareId(), message);
    }
}
