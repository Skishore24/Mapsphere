package com.mapsphere.websocket;

import org.springframework.context.annotation.Primary;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@Primary
public class SimpLocationBroker implements LocationBroker {

    private final SimpMessagingTemplate messagingTemplate;

    public SimpLocationBroker(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void broadcastLocation(String shareId, LocationMessage message) {
        messagingTemplate.convertAndSend("/topic/location/" + shareId, message);
    }
}
