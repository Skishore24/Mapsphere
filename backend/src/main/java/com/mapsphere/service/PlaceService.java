package com.mapsphere.service;

import com.mapsphere.dto.place.PlaceDto;
import com.mapsphere.entity.Place;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.PlaceRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public PlaceService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    public List<PlaceDto> getAllPlaces() {
        return placeRepository.findAll().stream().map(this::toDto).toList();
    }

    public PlaceDto getPlaceById(Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));
        return toDto(place);
    }

    public List<PlaceDto> getNearby(double lat, double lng, double radiusMeters) {
        return placeRepository.findNearbyPlaces(lat, lng, radiusMeters)
                .stream().map(this::toDto).toList();
    }

    public List<PlaceDto> getInBoundingBox(double minLat, double minLng, double maxLat, double maxLng) {
        return placeRepository.findInBoundingBox(minLat, minLng, maxLat, maxLng)
                .stream().map(this::toDto).toList();
    }

    public List<PlaceDto> getByCategory(String category) {
        return placeRepository.findByCategoryIgnoreCase(category)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public PlaceDto createPlace(PlaceDto dto) {
        Point location = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));

        Place place = Place.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .category(dto.getCategory().toUpperCase())
                .address(dto.getAddress())
                .location(location)
                .phone(dto.getPhone())
                .website(dto.getWebsite())
                .openingHours(dto.getOpeningHours())
                .rating(dto.getRating() != null ? dto.getRating() : 4.0)
                .build();

        return toDto(placeRepository.save(place));
    }

    @Transactional
    public PlaceDto updatePlace(Long id, PlaceDto dto) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));

        place.setName(dto.getName());
        place.setDescription(dto.getDescription());
        place.setCategory(dto.getCategory().toUpperCase());
        place.setAddress(dto.getAddress());
        place.setPhone(dto.getPhone());
        place.setWebsite(dto.getWebsite());
        place.setOpeningHours(dto.getOpeningHours());
        if (dto.getRating() != null) {
            place.setRating(dto.getRating());
        }

        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            place.setLocation(geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude())));
        }

        return toDto(placeRepository.save(place));
    }

    @Transactional
    public void deletePlace(Long id) {
        if (!placeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Place not found with id: " + id);
        }
        placeRepository.deleteById(id);
    }

    public PlaceDto toDto(Place place) {
        return PlaceDto.builder()
                .id(place.getId())
                .name(place.getName())
                .description(place.getDescription())
                .category(place.getCategory())
                .address(place.getAddress())
                .latitude(place.getLocation().getY())
                .longitude(place.getLocation().getX())
                .phone(place.getPhone())
                .website(place.getWebsite())
                .openingHours(place.getOpeningHours())
                .rating(place.getRating())
                .build();
    }
}
