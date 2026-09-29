package com.mapsphere.service;

import com.mapsphere.dto.search.SearchResult;
import com.mapsphere.entity.Place;
import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import com.mapsphere.service.geocoding.GeocodingProvider;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SearchService {

    private final PlaceRepository placeRepository;
    private final GeocodingProvider geocodingProvider;
    private final SearchHistoryRepository searchHistoryRepository;

    public SearchService(PlaceRepository placeRepository,
                         GeocodingProvider geocodingProvider,
                         SearchHistoryRepository searchHistoryRepository) {
        this.placeRepository = placeRepository;
        this.geocodingProvider = geocodingProvider;
        this.searchHistoryRepository = searchHistoryRepository;
    }

    public List<SearchResult> search(String query, Double lat, Double lng, User user) {
        List<SearchResult> combined = new ArrayList<>();

        if (query == null || query.trim().length() < 2) {
            return combined;
        }

        String cleanQuery = query.trim();

        // 1. Search internal database places (instant, spatial POIs)
        List<Place> localPlaces = placeRepository.searchByKeyword(cleanQuery);
        for (Place p : localPlaces) {
            double pLat = p.getLocation().getY();
            double pLng = p.getLocation().getX();

            Double distance = null;
            if (lat != null && lng != null) {
                distance = calculateHaversineDistance(lat, lng, pLat, pLng);
            }

            combined.add(SearchResult.builder()
                    .id("db-" + p.getId())
                    .name(p.getName())
                    .displayName(p.getName() + " · " + (p.getAddress() != null ? p.getAddress() : p.getCategory()))
                    .address(p.getAddress())
                    .latitude(pLat)
                    .longitude(pLng)
                    .category(p.getCategory())
                    .type("DATABASE_PLACE")
                    .placeId(p.getId())
                    .distance(distance)
                    .importance(0.9)
                    .phone(p.getPhone())
                    .website(p.getWebsite())
                    .openingHours(p.getOpeningHours())
                    .source("DATABASE")
                    .build());
        }

        // 2. Search external geocoding provider (Cities, Towns, Addresses)
        List<SearchResult> geocoded = geocodingProvider.search(cleanQuery, lat, lng);
        combined.addAll(geocoded);

        // 3. Deduplicate by coordinates proximity (< 50 meters)
        List<SearchResult> deduplicated = deduplicateResults(combined);

        // 4. Sort: Prioritize database POIs and results closer to user if distance available
        deduplicated.sort((a, b) -> {
            if ("DATABASE".equals(a.getSource()) && !"DATABASE".equals(b.getSource())) {
                return -1;
            }
            if (!"DATABASE".equals(a.getSource()) && "DATABASE".equals(b.getSource())) {
                return 1;
            }
            if (a.getDistance() != null && b.getDistance() != null) {
                return Double.compare(a.getDistance(), b.getDistance());
            }
            return Double.compare(
                    b.getImportance() != null ? b.getImportance() : 0.5,
                    a.getImportance() != null ? a.getImportance() : 0.5
            );
        });

        // 5. Save to search history if authenticated
        if (user != null) {
            try {
                searchHistoryRepository.save(SearchHistory.builder()
                        .user(user)
                        .query(cleanQuery)
                        .latitude(lat)
                        .longitude(lng)
                        .build());
            } catch (Exception ignored) {}
        }

        return deduplicated;
    }

    public List<SearchResult> autocomplete(String query, Double lat, Double lng) {
        return search(query, lat, lng, null);
    }

    public SearchResult reverseGeocode(double lat, double lng) {
        return geocodingProvider.reverseGeocode(lat, lng);
    }

    private List<SearchResult> deduplicateResults(List<SearchResult> list) {
        List<SearchResult> result = new ArrayList<>();
        for (SearchResult item : list) {
            boolean isDuplicate = false;
            for (SearchResult existing : result) {
                double dist = calculateHaversineDistance(
                        item.getLatitude(), item.getLongitude(),
                        existing.getLatitude(), existing.getLongitude()
                );
                if (dist < 50 && item.getName().equalsIgnoreCase(existing.getName())) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                result.add(item);
            }
        }
        return result;
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }
}
