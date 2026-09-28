package com.mapsphere.controller;

import com.mapsphere.repository.LocationShareSessionRepository;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final RouteHistoryRepository routeHistoryRepository;
    private final LocationShareSessionRepository sessionRepository;

    public AdminController(UserRepository userRepository,
                           PlaceRepository placeRepository,
                           RouteHistoryRepository routeHistoryRepository,
                           LocationShareSessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
        this.routeHistoryRepository = routeHistoryRepository;
        this.sessionRepository = sessionRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPlaces", placeRepository.count());
        stats.put("totalCalculatedRoutes", routeHistoryRepository.count());
        stats.put("activeLiveSessions", sessionRepository.countByActiveTrueAndExpiresAtAfter(LocalDateTime.now()));
        stats.put("systemStatus", "OPERATIONAL");
        stats.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(stats);
    }
}
