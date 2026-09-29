package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.dto.place.PlaceDto;
import com.mapsphere.exception.BadRequestException;
import com.mapsphere.service.PlaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/map")
public class MapController {

    private final PlaceService placeService;

    // Maximum degrees span allowed in a single viewport query to protect database performance
    private static final double MAX_LAT_SPAN = 8.0;
    private static final double MAX_LNG_SPAN = 8.0;

    public MapController(PlaceService placeService) {
        this.placeService = placeService;
    }

    /**
     * Viewport Bounding Box query:
     * GET /api/v1/map/places/bbox?minLat=...&minLng=...&maxLat=...&maxLng=...&zoom=14&category=RESTAURANT
     */
    @GetMapping("/places/bbox")
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getPlacesInBoundingBox(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng,
            @RequestParam(required = false, defaultValue = "14") int zoom,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "150") int limit) {

        // Validate coordinate bounds
        if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
            throw new BadRequestException("Latitude must be between -90 and 90, and longitude between -180 and 180.");
        }

        if (minLat > maxLat || minLng > maxLng) {
            throw new BadRequestException("minLat and minLng must not exceed maxLat and maxLng.");
        }

        // Protect from giant bounding box queries that cause database denial-of-service
        double latSpan = maxLat - minLat;
        double lngSpan = maxLng - minLng;
        if (latSpan > MAX_LAT_SPAN || lngSpan > MAX_LNG_SPAN) {
            throw new BadRequestException(
                    String.format("Requested bounding box is too large (latSpan: %.2f°, lngSpan: %.2f°). Please zoom in closer.",
                            latSpan, lngSpan)
            );
        }

        List<PlaceDto> places = placeService.getInBoundingBox(minLat, minLng, maxLat, maxLng);

        // Filter by category if requested
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            places = places.stream()
                    .filter(p -> p.getCategory().equalsIgnoreCase(category.trim()))
                    .toList();
        }

        // Adaptive limit based on zoom level
        int effectiveLimit = zoom < 10 ? Math.min(limit, 30) : (zoom < 13 ? Math.min(limit, 75) : limit);
        if (places.size() > effectiveLimit) {
            places = places.subList(0, effectiveLimit);
        }

        return ResponseEntity.ok(ApiResponse.success(places));
    }
}
