package com.mapsphere.service;

import com.mapsphere.dto.place.PlaceDto;
import com.mapsphere.entity.Place;
import com.mapsphere.repository.PlaceRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PoiIngestionService {

    private static final Logger log = LoggerFactory.getLogger(PoiIngestionService.class);

    private final PlaceRepository placeRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public PoiIngestionService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    @Transactional
    public Map<String, Object> ingestPlaces(List<PlaceDto> placesToIngest) {
        int inserted = 0;
        int updated = 0;
        int invalid = 0;

        List<String> errors = new ArrayList<>();

        for (PlaceDto dto : placesToIngest) {
            // 1. Validate coordinates
            if (dto.getLatitude() == null || dto.getLongitude() == null ||
                dto.getLatitude() < -90 || dto.getLatitude() > 90 ||
                dto.getLongitude() < -180 || dto.getLongitude() > 180) {
                invalid++;
                errors.add("Invalid coordinates for place: " + dto.getName());
                continue;
            }

            if (dto.getName() == null || dto.getName().isBlank()) {
                invalid++;
                errors.add("Missing name for POI entry");
                continue;
            }

            String normalizedCat = normalizeCategory(dto.getCategory());
            double lat = dto.getLatitude();
            double lng = dto.getLongitude();

            // 2. Proximity deduplication check (within 35 meters)
            List<Place> nearby = placeRepository.findNearbyPlaces(lat, lng, 35.0);
            Optional<Place> match = nearby.stream()
                    .filter(p -> p.getName().trim().equalsIgnoreCase(dto.getName().trim()))
                    .findFirst();

            if (match.isPresent()) {
                // Update existing place
                Place existing = match.get();
                if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
                if (dto.getAddress() != null) existing.setAddress(dto.getAddress());
                if (dto.getPhone() != null) existing.setPhone(dto.getPhone());
                if (dto.getWebsite() != null) existing.setWebsite(dto.getWebsite());
                if (dto.getOpeningHours() != null) existing.setOpeningHours(dto.getOpeningHours());
                if (dto.getRating() != null) existing.setRating(dto.getRating());
                existing.setCategory(normalizedCat);
                placeRepository.save(existing);
                updated++;
            } else {
                // Insert new place
                Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
                Place newPlace = Place.builder()
                        .name(dto.getName().trim())
                        .description(dto.getDescription())
                        .category(normalizedCat)
                        .address(dto.getAddress())
                        .location(point)
                        .phone(dto.getPhone())
                        .website(dto.getWebsite())
                        .openingHours(dto.getOpeningHours())
                        .rating(dto.getRating() != null ? dto.getRating() : 4.0)
                        .build();

                placeRepository.save(newPlace);
                inserted++;
            }
        }

        log.info("POI Ingestion complete: inserted={}, updated={}, invalid={}", inserted, updated, invalid);

        return Map.of(
                "totalSubmitted", placesToIngest.size(),
                "inserted", inserted,
                "updated", updated,
                "invalid", invalid,
                "errors", errors.subList(0, Math.min(errors.size(), 10))
        );
    }

    private String normalizeCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.isBlank()) return "OTHER";
        return switch (rawCategory.trim().toUpperCase()) {
            case "RESTAURANT", "FOOD", "DINING", "FAST_FOOD", "EATERY" -> "RESTAURANT";
            case "HOSPITAL", "CLINIC", "HEALTHCARE", "DOCTOR", "MEDICAL" -> "HOSPITAL";
            case "HOTEL", "MOTEL", "RESORT", "LODGING", "STAY" -> "HOTEL";
            case "COLLEGE", "UNIVERSITY", "SCHOOL", "EDUCATION", "ACADEMY" -> "COLLEGE";
            case "PARK", "GARDEN", "RECREATION", "PLAYGROUND", "TRAIL" -> "PARK";
            case "PETROL_STATION", "FUEL", "GAS_STATION", "EV_CHARGER", "CHARGING" -> "PETROL_STATION";
            case "BANK", "ATM", "FINANCE" -> "BANK";
            case "PHARMACY", "CHEMIST", "DRUGSTORE" -> "PHARMACY";
            case "SHOP", "STORE", "MALL", "SUPERMARKET", "GROCERY", "RETAIL" -> "SHOP";
            case "CAFE", "COFFEE", "BAKERY", "TEA" -> "CAFE";
            default -> "OTHER";
        };
    }
}
