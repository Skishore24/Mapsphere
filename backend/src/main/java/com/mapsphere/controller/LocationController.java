package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.entity.LocationShareSession;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.exception.SessionExpiredException;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> startLocationShare(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Map<String, Object> sessionData = locationService.createShareSession(user);
        return ResponseEntity.ok(ApiResponse.success(sessionData));
    }

    @GetMapping({"/track/{shareId}", "/share/{shareId}"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLiveTrackingSession(@PathVariable String shareId) {
        LocationShareSession session = locationService.getSession(shareId);

        if (!session.isActive() || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new SessionExpiredException("This live sharing session has expired or was ended by the owner.");
        }

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

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/share/{shareId}")
    public ResponseEntity<ApiResponse<Void>> stopLocationShare(
            @PathVariable String shareId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        locationService.stopShareSession(shareId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Live sharing stopped successfully"));
    }
}
