package com.mapsphere.service.geocoding;

import com.mapsphere.dto.search.SearchResult;

import java.util.List;

public interface GeocodingProvider {
    List<SearchResult> search(String query, Double userLat, Double userLng);
    List<SearchResult> autocomplete(String query, Double userLat, Double userLng);
    SearchResult reverseGeocode(double lat, double lng);
}
