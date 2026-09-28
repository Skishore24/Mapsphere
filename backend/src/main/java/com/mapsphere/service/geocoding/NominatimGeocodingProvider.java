package com.mapsphere.service.geocoding;

import com.mapsphere.dto.search.SearchResult;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class NominatimGeocodingProvider implements GeocodingProvider {

    private final RestTemplate restTemplate;

    public NominatimGeocodingProvider(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(3))
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<SearchResult> geocode(String query) {
        List<SearchResult> results = new ArrayList<>();
        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/search")
                    .queryParam("q", query)
                    .queryParam("format", "json")
                    .queryParam("limit", "5")
                    .queryParam("addressdetails", "1")
                    .encode()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "MapSphere-Application/1.0 (contact@mapsphere.internal)");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                for (Object item : response.getBody()) {
                    if (item instanceof Map map) {
                        String displayName = (String) map.get("display_name");
                        String latStr = (String) map.get("lat");
                        String lonStr = (String) map.get("lon");
                        String type = (String) map.get("type");

                        if (displayName != null && latStr != null && lonStr != null) {
                            String shortName = displayName.split(",")[0].trim();
                            results.add(SearchResult.builder()
                                    .name(shortName)
                                    .address(displayName)
                                    .latitude(Double.parseDouble(latStr))
                                    .longitude(Double.parseDouble(lonStr))
                                    .category(type != null ? type.toUpperCase() : "LOCATION")
                                    .source("NOMINATIM")
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Graceful fallback if offline or Nominatim is unreachable
        }
        return results;
    }
}
