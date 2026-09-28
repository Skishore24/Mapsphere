package com.mapsphere.controller;

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
    public ResponseEntity<List<PlaceDto>> getAllPlaces() {
        return ResponseEntity.ok(placeService.getAllPlaces());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceDto> getPlaceById(@PathVariable Long id) {
        return ResponseEntity.ok(placeService.getPlaceById(id));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<PlaceDto>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") double radius) {
        return ResponseEntity.ok(placeService.getNearby(lat, lng, radius));
    }

    @GetMapping("/bbox")
    public ResponseEntity<List<PlaceDto>> getInBoundingBox(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng) {
        return ResponseEntity.ok(placeService.getInBoundingBox(minLat, minLng, maxLat, maxLng));
    }

    @PostMapping
    public ResponseEntity<PlaceDto> createPlace(@Valid @RequestBody PlaceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(placeService.createPlace(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceDto> updatePlace(@PathVariable Long id, @Valid @RequestBody PlaceDto dto) {
        return ResponseEntity.ok(placeService.updatePlace(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(@PathVariable Long id) {
        placeService.deletePlace(id);
        return ResponseEntity.noContent().build();
    }
}
