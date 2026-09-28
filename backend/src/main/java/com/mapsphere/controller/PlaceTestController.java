package com.mapsphere.controller;

import com.mapsphere.entity.Place;
import com.mapsphere.repository.PlaceRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/places/test")
public class PlaceTestController {

    private final PlaceRepository placeRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public PlaceTestController(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    /**
     * Seeds 3 sample places around (lat: 10.655, lng: 77.000):
     * 1. Central Cafe   (~0.5 km away) -> Should be inside 5 km
     * 2. City Hospital (~2.1 km away) -> Should be inside 5 km
     * 3. Far Away Resort (~35 km away) -> Should be EXCLUDED by the 5 km filter
     */
    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedPlaces() {
        placeRepository.deleteAll();

        // Important: JTS uses Coordinate(X, Y) which is (longitude, latitude)
        Point p1 = geometryFactory.createPoint(new Coordinate(77.005, 10.660)); // ~0.5 km
        Point p2 = geometryFactory.createPoint(new Coordinate(77.015, 10.670)); // ~2.1 km
        Point p3 = geometryFactory.createPoint(new Coordinate(77.300, 10.900)); // ~35 km

        placeRepository.save(Place.builder().name("Central Cafe").category("RESTAURANT").address("Market Street").location(p1).rating(4.5).build());
        placeRepository.save(Place.builder().name("City Hospital").category("HOSPITAL").address("Health Ave").location(p2).rating(4.8).build());
        placeRepository.save(Place.builder().name("Far Away Resort").category("HOTEL").address("Mountain Road").location(p3).rating(4.2).build());

        return ResponseEntity.ok(Map.of(
            "message", "Sample spatial places seeded successfully!",
            "seededCount", 3
        ));
    }

    /**
     * Query: Find all places within radius (default: 5000 meters / 5 km)
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<Map<String, Object>>> getNearby(
            @RequestParam(defaultValue = "10.655") double lat,
            @RequestParam(defaultValue = "77.000") double lng,
            @RequestParam(defaultValue = "5000") double radius) {

        List<Place> nearby = placeRepository.findNearbyPlaces(lat, lng, radius, 50);

        List<Map<String, Object>> response = nearby.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("category", p.getCategory());
            map.put("address", p.getAddress());
            map.put("latitude", p.getLocation().getY());
            map.put("longitude", p.getLocation().getX());
            map.put("rating", p.getRating());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }
}
