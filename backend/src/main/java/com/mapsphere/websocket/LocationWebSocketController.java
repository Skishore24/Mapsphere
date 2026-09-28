package com.mapsphere.websocket;

import com.mapsphere.dto.location.LiveLocationUpdate;
import com.mapsphere.service.LocationService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class LocationWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final LocationService locationService;

    public LocationWebSocketController(SimpMessagingTemplate messagingTemplate, LocationService locationService) {
        this.messagingTemplate = messagingTemplate;
        this.locationService = locationService;
    }

    /**
     * Mobile or browser client publishes location packet to /app/location.update
     * Server saves the position and broadcasts to all subscribers watching /topic/location/{shareId}
     */
    @MessageMapping("/location.update")
    public void updateLocation(@Payload LiveLocationUpdate update) {
        LiveLocationUpdate processed = locationService.updateLocation(update);
        messagingTemplate.convertAndSend("/topic/location/" + update.getShareId(), processed);
    }
}
