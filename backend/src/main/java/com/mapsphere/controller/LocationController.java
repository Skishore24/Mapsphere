package com.mapsphere.controller;

import com.mapsphere.entity.LocationShareSession;
import com.mapsphere.entity.User;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/location")
public class LocationController {

    private final LocationService locationService;
    private final UserRepository userRepository;

    public LocationController(LocationService locationService, UserRepository userRepository) {
        this.locationService = locationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/share")
    public ResponseEntity<Map<String, Object>> startLocationShare(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(locationService.createShareSession(user));
    }

    @GetMapping("/track/{shareId}")
    public ResponseEntity<Map<String, Object>> getLiveTrackingSession(@PathVariable String shareId) {
        LocationShareSession session = locationService.getSession(shareId);

        Map<String, Object> response = new HashMap<>();
        response.put("shareId", session.getShareId());
        response.put("sharerName", session.getUser().getName());
        response.put("latitude", session.getLastLat());
        response.put("longitude", session.getLastLng());
        response.put("accuracy", session.getLastAccuracy());
        response.put("heading", session.getLastHeading());
        response.put("speed", session.getLastSpeed());
        response.put("lastUpdate", session.getLastUpdate());
        response.put("expiresAt", session.getExpiresAt());
        response.put("active", session.isActive());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/share/{shareId}")
    public ResponseEntity<Void> stopLocationShare(
            @PathVariable String shareId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        locationService.stopShareSession(shareId, user);
        return ResponseEntity.noContent().build();
    }
}
