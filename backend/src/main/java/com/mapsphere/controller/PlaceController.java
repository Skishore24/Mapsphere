package com.mapsphere.controller;

import com.mapsphere.dto.place.PlaceRequest;
import com.mapsphere.dto.place.PlaceResponse;
import com.mapsphere.service.PlaceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
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
    public ResponseEntity<Page<PlaceResponse>> getPlaces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(placeService.getPlaces(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceResponse> getPlaceById(@PathVariable Long id) {
        return ResponseEntity.ok(placeService.getPlaceById(id));
    }

    @PostMapping
    public ResponseEntity<PlaceResponse> createPlace(@Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(placeService.createPlace(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceResponse> updatePlace(
            @PathVariable Long id,
            @Valid @RequestBody PlaceRequest request) {
        return ResponseEntity.ok(placeService.updatePlace(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(@PathVariable Long id) {
        placeService.deletePlace(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<PlaceResponse>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") double radius,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(placeService.getNearbyPlaces(lat, lng, radius, limit));
    }

    @GetMapping("/bbox")
    public ResponseEntity<List<PlaceResponse>> getPlacesInBoundingBox(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng,
            @RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(placeService.getPlacesInBoundingBox(minLat, minLng, maxLat, maxLng, limit));
    }
}
