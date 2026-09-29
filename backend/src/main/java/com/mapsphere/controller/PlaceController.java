package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.dto.place.PlaceDto;
import com.mapsphere.service.PlaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getAllPlaces() {
        return ResponseEntity.ok(ApiResponse.success(placeService.getAllPlaces()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceDto>> getPlaceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getPlaceById(id)));
    }

    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") double radius) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getNearby(lat, lng, radius)));
    }

    @GetMapping("/bbox")
    public ResponseEntity<ApiResponse<List<PlaceDto>>> getInBoundingBox(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng) {
        return ResponseEntity.ok(ApiResponse.success(placeService.getInBoundingBox(minLat, minLng, maxLat, maxLng)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlaceDto>> createPlace(@Valid @RequestBody PlaceDto dto) {
        PlaceDto created = placeService.createPlace(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Place created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlaceDto>> updatePlace(@PathVariable Long id, @Valid @RequestBody PlaceDto dto) {
        PlaceDto updated = placeService.updatePlace(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Place updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlace(@PathVariable Long id) {
        placeService.deletePlace(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Place deleted successfully"));
    }
}
