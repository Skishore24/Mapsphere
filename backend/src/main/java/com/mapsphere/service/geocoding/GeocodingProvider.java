package com.mapsphere.service.geocoding;

import com.mapsphere.dto.search.SearchResult;

import java.util.List;

public interface GeocodingProvider {
    List<SearchResult> geocode(String query);
}
