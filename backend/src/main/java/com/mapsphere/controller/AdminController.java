package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.dto.place.PlaceDto;
import com.mapsphere.entity.SearchHistory;
import com.mapsphere.repository.LocationShareSessionRepository;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.PoiIngestionService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final RouteHistoryRepository routeHistoryRepository;
    private final LocationShareSessionRepository sessionRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final PoiIngestionService poiIngestionService;

    public AdminController(UserRepository userRepository,
                           PlaceRepository placeRepository,
                           RouteHistoryRepository routeHistoryRepository,
                           LocationShareSessionRepository sessionRepository,
                           SearchHistoryRepository searchHistoryRepository,
                           PoiIngestionService poiIngestionService) {
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
        this.routeHistoryRepository = routeHistoryRepository;
        this.sessionRepository = sessionRepository;
        this.searchHistoryRepository = searchHistoryRepository;
        this.poiIngestionService = poiIngestionService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPlaces", placeRepository.count());
        stats.put("totalCalculatedRoutes", routeHistoryRepository.count());
        stats.put("totalSearches", searchHistoryRepository.count());
        stats.put("activeLiveSessions", sessionRepository.countByActiveTrueAndExpiresAtAfter(LocalDateTime.now()));
        stats.put("systemStatus", "OPERATIONAL");
        stats.put("timestamp", LocalDateTime.now());

        // Memory statistics
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        stats.put("memoryUsedMb", totalMemory - freeMemory);
        stats.put("memoryTotalMb", totalMemory);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping("/places/import")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importPlaces(@RequestBody List<PlaceDto> places) {
        Map<String, Object> result = poiIngestionService.ingestPlaces(places);
        return ResponseEntity.ok(ApiResponse.success(result, "POI ingestion executed successfully"));
    }

    @GetMapping("/searches/recent")
    public ResponseEntity<ApiResponse<List<SearchHistory>>> getRecentSystemSearches() {
        List<SearchHistory> recent = searchHistoryRepository.findAll(PageRequest.of(0, 20)).getContent();
        return ResponseEntity.ok(ApiResponse.success(recent));
    }
}
