package com.mapsphere.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${mapsphere.websocket.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Qualifier("messageBrokerTaskScheduler")
    private org.springframework.scheduling.TaskScheduler messageBrokerTaskScheduler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker with heartbeats (10s outgoing, 10s incoming)
        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(messageBrokerTaskScheduler);

        // Prefix for incoming messages routed to @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        // Configured origins and patterns (supports *.vercel.app)
        registry.addEndpoint("/ws-mapsphere")
                .setAllowedOriginPatterns(origins)
                .withSockJS()
                .setHeartbeatTime(25000);
    }
}
