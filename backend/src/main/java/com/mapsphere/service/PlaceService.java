package com.mapsphere.service;

import com.mapsphere.dto.place.PlaceRequest;
import com.mapsphere.dto.place.PlaceResponse;
import com.mapsphere.entity.Place;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.PlaceRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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

    public Page<PlaceResponse> getPlaces(int page, int size) {
        return placeRepository.findAll(PageRequest.of(page, size)).map(this::toResponse);
    }

    public PlaceResponse getPlaceById(Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));
        return toResponse(place);
    }

    @Transactional
    public PlaceResponse createPlace(PlaceRequest request) {
        Point point = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));

        Place place = Place.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory().toUpperCase())
                .address(request.getAddress())
                .location(point)
                .phone(request.getPhone())
                .website(request.getWebsite())
                .rating(request.getRating() != null ? request.getRating() : 0.0)
                .build();

        return toResponse(placeRepository.save(place));
    }

    @Transactional
    public PlaceResponse updatePlace(Long id, PlaceRequest request) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + id));

        Point point = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));

        place.setName(request.getName());
        place.setDescription(request.getDescription());
        place.setCategory(request.getCategory().toUpperCase());
        place.setAddress(request.getAddress());
        place.setLocation(point);
        place.setPhone(request.getPhone());
        place.setWebsite(request.getWebsite());
        if (request.getRating() != null) {
            place.setRating(request.getRating());
        }

        return toResponse(placeRepository.save(place));
    }

    @Transactional
    public void deletePlace(Long id) {
        if (!placeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Place not found with id: " + id);
        }
        placeRepository.deleteById(id);
    }

    public List<PlaceResponse> getNearbyPlaces(double lat, double lng, double radiusMeters, int limit) {
        return placeRepository.findNearbyPlaces(lat, lng, radiusMeters, limit).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PlaceResponse> getPlacesInBoundingBox(double minLat, double minLng, double maxLat, double maxLng, int limit) {
        return placeRepository.findInBoundingBox(minLat, minLng, maxLat, maxLng, limit).stream()
                .map(this::toResponse)
                .toList();
    }

    public PlaceResponse toResponse(Place place) {
        return PlaceResponse.builder()
                .id(place.getId())
                .name(place.getName())
                .description(place.getDescription())
                .category(place.getCategory())
                .address(place.getAddress())
                .latitude(place.getLocation().getY())
                .longitude(place.getLocation().getX())
                .phone(place.getPhone())
                .website(place.getWebsite())
                .rating(place.getRating())
                .createdAt(place.getCreatedAt())
                .build();
    }
}
