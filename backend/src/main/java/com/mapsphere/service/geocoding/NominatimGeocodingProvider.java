package com.mapsphere.service.geocoding;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mapsphere.dto.search.SearchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Component
public class NominatimGeocodingProvider implements GeocodingProvider {

    private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingProvider.class);

    @Value("${mapsphere.geocoding.nominatim-url:https://nominatim.openstreetmap.org}")
    private String nominatimUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public List<SearchResult> search(String query) {
        List<SearchResult> results = new ArrayList<>();
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl)
                    .path("/search")
                    .queryParam("q", query)
                    .queryParam("format", "json")
                    .queryParam("addressdetails", 1)
                    .queryParam("limit", 6)
                    .build()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "MapSphere-Application/1.0 (mapsphere-project@local.dev)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.isArray()) {
                    for (JsonNode item : root) {
                        String name = item.has("name") && !item.get("name").asText().isEmpty() 
                                ? item.get("name").asText() 
                                : item.path("display_name").asText().split(",")[0];
                        
                        results.add(SearchResult.builder()
                                .name(name)
                                .displayName(item.path("display_name").asText())
                                .latitude(item.path("lat").asDouble())
                                .longitude(item.path("lon").asDouble())
                                .category(item.path("type").asText("location").toUpperCase())
                                .type("GEOCODED_ADDRESS")
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Nominatim geocoding search failed for query '{}': {}", query, e.getMessage());
        }
        return results;
    }

    @Override
    public SearchResult reverseGeocode(double lat, double lng) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl)
                    .path("/reverse")
                    .queryParam("lat", lat)
                    .queryParam("lon", lng)
                    .queryParam("format", "json")
                    .build()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "MapSphere-Application/1.0 (mapsphere-project@local.dev)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode item = objectMapper.readTree(response.getBody());
                String displayName = item.path("display_name").asText("Unknown Location");
                String name = displayName.split(",")[0];

                return SearchResult.builder()
                        .name(name)
                        .displayName(displayName)
                        .latitude(lat)
                        .longitude(lng)
                        .type("GEOCODED_ADDRESS")
                        .build();
            }
        } catch (Exception e) {
            log.warn("Nominatim reverse geocode failed for ({}, {}): {}", lat, lng, e.getMessage());
        }

        return SearchResult.builder()
                .name(String.format("Location (%.4f, %.4f)", lat, lng))
                .displayName(String.format("Latitude: %.5f, Longitude: %.5f", lat, lng))
                .latitude(lat)
                .longitude(lng)
                .type("GEOCODED_ADDRESS")
                .build();
    }
}
