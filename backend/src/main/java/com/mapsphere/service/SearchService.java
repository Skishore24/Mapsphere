package com.mapsphere.service;

import com.mapsphere.dto.search.SearchResult;
import com.mapsphere.entity.Place;
import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.geocoding.GeocodingProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchService {

    private final PlaceRepository placeRepository;
    private final GeocodingProvider geocodingProvider;
    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    public SearchService(
            PlaceRepository placeRepository,
            GeocodingProvider geocodingProvider,
            SearchHistoryRepository searchHistoryRepository,
            UserRepository userRepository
    ) {
        this.placeRepository = placeRepository;
        this.geocodingProvider = geocodingProvider;
        this.searchHistoryRepository = searchHistoryRepository;
        this.userRepository = userRepository;
    }

    public List<SearchResult> search(String query, String userEmail) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        String trimmed = query.trim();
        List<SearchResult> results = new ArrayList<>();

        // 1. Search local PostGIS places database
        List<Place> localPlaces = placeRepository.searchByQuery(trimmed);
        for (Place p : localPlaces) {
            results.add(SearchResult.builder()
                    .placeId(p.getId())
                    .name(p.getName())
                    .address(p.getAddress())
                    .latitude(p.getLocation().getY())
                    .longitude(p.getLocation().getX())
                    .category(p.getCategory())
                    .source("LOCAL")
                    .build());
        }

        // 2. Query Geocoding Provider (Nominatim / OpenStreetMap)
        List<SearchResult> geoResults = geocodingProvider.geocode(trimmed);
        results.addAll(geoResults);

        // 3. Record in SearchHistory if user is logged in
        if (userEmail != null && !userEmail.isBlank() && !results.isEmpty()) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                SearchResult first = results.get(0);
                searchHistoryRepository.save(SearchHistory.builder()
                        .user(user)
                        .query(trimmed)
                        .latitude(first.getLatitude())
                        .longitude(first.getLongitude())
                        .build());
            });
        }

        return results;
    }
}
