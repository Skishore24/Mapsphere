package com.mapsphere.service;

import com.mapsphere.dto.search.SearchResult;
import com.mapsphere.entity.Place;
import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import com.mapsphere.service.geocoding.GeocodingProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

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

        // 1. Search internal database places (instant)
        List<Place> localPlaces = placeRepository.searchByKeyword(cleanQuery);
        for (Place p : localPlaces) {
            combined.add(SearchResult.builder()
                    .name(p.getName())
                    .displayName(p.getName() + " - " + p.getAddress())
                    .latitude(p.getLocation().getY())
                    .longitude(p.getLocation().getX())
                    .category(p.getCategory())
                    .type("DATABASE_PLACE")
                    .placeId(p.getId())
                    .build());
        }

        // 2. Search external geocoding provider (Addresses, Cities, Towns)
        List<SearchResult> geocoded = geocodingProvider.search(cleanQuery);
        combined.addAll(geocoded);

        // 3. Save to search history if authenticated
        if (user != null) {
            searchHistoryRepository.save(SearchHistory.builder()
                    .user(user)
                    .query(cleanQuery)
                    .latitude(lat)
                    .longitude(lng)
                    .build());
        }

        return combined;
    }

    public SearchResult reverseGeocode(double lat, double lng) {
        return geocodingProvider.reverseGeocode(lat, lng);
    }
}
