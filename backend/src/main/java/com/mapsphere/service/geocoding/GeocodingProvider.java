package com.mapsphere.service.geocoding;

import com.mapsphere.dto.search.SearchResult;

import java.util.List;

public interface GeocodingProvider {
    List<SearchResult> search(String query);
    SearchResult reverseGeocode(double lat, double lng);
}
