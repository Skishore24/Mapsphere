package com.mapsphere.controller;

import com.mapsphere.dto.location.LiveLocationUpdate;
import com.mapsphere.dto.location.ShareLocationRequest;
import com.mapsphere.dto.location.ShareLocationResponse;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/location")
public class LocationController {

    private final LocationService locationService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public LocationController(
            LocationService locationService,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.locationService = locationService;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/share")
    public ResponseEntity<ShareLocationResponse> createShareSession(
            @RequestBody(required = false) ShareLocationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int duration = (request != null && request.getDurationMinutes() > 0) ? request.getDurationMinutes() : 60;
        return ResponseEntity.ok(locationService.createShareSession(user, duration));
    }

    @GetMapping("/share/{shareId}")
    public ResponseEntity<ShareLocationResponse> getShareSession(@PathVariable String shareId) {
        return ResponseEntity.ok(locationService.getSession(shareId));
    }

    @DeleteMapping("/share/{shareId}")
    public ResponseEntity<Void> stopShareSession(
            @PathVariable String shareId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        locationService.stopSession(shareId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/update")
    public ResponseEntity<LiveLocationUpdate> updateLocationHttp(
            @Valid @RequestBody LiveLocationUpdate update) {
        LiveLocationUpdate saved = locationService.updateLocation(update);
        messagingTemplate.convertAndSend("/topic/location/" + update.getShareId(), saved);
        return ResponseEntity.ok(saved);
    }
}
