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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NominatimGeocodingProvider implements GeocodingProvider {

    private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingProvider.class);

    @Value("${mapsphere.geocoding.nominatim-url:https://nominatim.openstreetmap.org}")
    private String nominatimUrl;

    @Value("${mapsphere.geocoding.user-agent:MapSphere-Platform/1.0 (production-mapsphere@local.dev)}")
    private String userAgent;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache with 1 hour TTL
    private final Map<String, CacheEntry<List<SearchResult>>> searchCache = new ConcurrentHashMap<>();
    private final Map<String, CacheEntry<SearchResult>> reverseCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60 * 60 * 1000;

    // Rate limiter: Max 1 request per second to adhere to OSM Nominatim fair use policy
    private long lastRequestTime = 0;
    private final Object rateLimitLock = new Object();

    public NominatimGeocodingProvider() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    private void enforceRateLimit() {
        synchronized (rateLimitLock) {
            long now = System.currentTimeMillis();
            long timeSinceLast = now - lastRequestTime;
            if (timeSinceLast < 1000) {
                try {
                    Thread.sleep(1000 - timeSinceLast);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            lastRequestTime = System.currentTimeMillis();
        }
    }

    @Override
    public List<SearchResult> search(String query, Double userLat, Double userLng) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        String normalizedQuery = query.trim().toLowerCase(Locale.ROOT);
        String cacheKey = normalizedQuery + (userLat != null ? ":" + userLat + "," + userLng : "");

        CacheEntry<List<SearchResult>> cached = searchCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }

        List<SearchResult> results = executeSearchWithRetry(query, userLat, userLng, 6);
        if (!results.isEmpty()) {
            searchCache.put(cacheKey, new CacheEntry<>(results));
        }

        return results;
    }

    @Override
    public List<SearchResult> autocomplete(String query, Double userLat, Double userLng) {
        return search(query, userLat, userLng);
    }

    @Override
    public SearchResult reverseGeocode(double lat, double lng) {
        String cacheKey = String.format(Locale.US, "%.5f,%.5f", lat, lng);
        CacheEntry<SearchResult> cached = reverseCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.data;
        }

        SearchResult result = executeReverseGeocodeWithRetry(lat, lng);
        reverseCache.put(cacheKey, new CacheEntry<>(result));
        return result;
    }

    private List<SearchResult> executeSearchWithRetry(String query, Double userLat, Double userLng, int limit) {
        int attempts = 0;
        int maxAttempts = 2;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                enforceRateLimit();

                UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(nominatimUrl)
                        .path("/search")
                        .queryParam("q", query)
                        .queryParam("format", "jsonv2")
                        .queryParam("addressdetails", 1)
                        .queryParam("limit", limit);

                // If user coords available, bias search to surrounding region
                if (userLat != null && userLng != null) {
                    double delta = 0.5; // ~55 km radius box
                    builder.queryParam("viewbox", String.format(Locale.US, "%f,%f,%f,%f",
                            userLng - delta, userLat + delta, userLng + delta, userLat - delta));
                }

                URI uri = builder.build().toUri();

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", userAgent);
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    List<SearchResult> results = new ArrayList<>();

                    if (root.isArray()) {
                        for (JsonNode item : root) {
                            double lat = item.path("lat").asDouble();
                            double lng = item.path("lon").asDouble();
                            String displayName = item.path("display_name").asText();
                            String rawType = item.path("type").asText("location").toUpperCase();
                            String placeRank = item.path("importance").asText("0.5");

                            String name = item.has("name") && !item.get("name").asText().isEmpty()
                                    ? item.get("name").asText()
                                    : displayName.split(",")[0].trim();

                            Double distance = null;
                            if (userLat != null && userLng != null) {
                                distance = calculateHaversineDistance(userLat, userLng, lat, lng);
                            }

                            results.add(SearchResult.builder()
                                    .id("nom-" + item.path("place_id").asText(UUID.randomUUID().toString()))
                                    .name(name)
                                    .displayName(displayName)
                                    .address(displayName)
                                    .latitude(lat)
                                    .longitude(lng)
                                    .category(mapCategory(rawType))
                                    .type(mapPlaceType(rawType))
                                    .distance(distance)
                                    .importance(Double.parseDouble(placeRank))
                                    .source("NOMINATIM")
                                    .build());
                        }
                    }
                    return results;
                }
            } catch (Exception e) {
                log.warn("Nominatim search attempt {} failed for query '{}': {}", attempts, query, e.getMessage());
                if (attempts < maxAttempts) {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ignored) {}
                }
            }
        }

        return Collections.emptyList();
    }

    private SearchResult executeReverseGeocodeWithRetry(double lat, double lng) {
        int attempts = 0;
        int maxAttempts = 2;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                enforceRateLimit();

                URI uri = UriComponentsBuilder.fromHttpUrl(nominatimUrl)
                        .path("/reverse")
                        .queryParam("lat", lat)
                        .queryParam("lon", lng)
                        .queryParam("format", "jsonv2")
                        .queryParam("addressdetails", 1)
                        .build()
                        .toUri();

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", userAgent);
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode item = objectMapper.readTree(response.getBody());
                    String displayName = item.path("display_name").asText("Unknown Location");
                    String name = item.has("name") && !item.get("name").asText().isEmpty()
                            ? item.get("name").asText()
                            : displayName.split(",")[0].trim();

                    return SearchResult.builder()
                            .id("rev-" + item.path("place_id").asText(UUID.randomUUID().toString()))
                            .name(name)
                            .displayName(displayName)
                            .address(displayName)
                            .latitude(lat)
                            .longitude(lng)
                            .type("ADDRESS")
                            .category("LOCATION")
                            .source("NOMINATIM")
                            .build();
                }
            } catch (Exception e) {
                log.warn("Nominatim reverse geocode attempt {} failed for ({}, {}): {}", attempts, lat, lng, e.getMessage());
                if (attempts < maxAttempts) {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ignored) {}
                }
            }
        }

        // Graceful non-blocking fallback
        return SearchResult.builder()
                .id("rev-coord")
                .name(String.format(Locale.US, "Location (%.4f, %.4f)", lat, lng))
                .displayName(String.format(Locale.US, "Coordinates: %.5f, %.5f", lat, lng))
                .address(String.format(Locale.US, "Coordinates: %.5f, %.5f", lat, lng))
                .latitude(lat)
                .longitude(lng)
                .type("COORDINATE")
                .category("LOCATION")
                .source("INTERNAL")
                .build();
    }

    private String mapCategory(String rawType) {
        return switch (rawType.toUpperCase()) {
            case "RESTAURANT", "FAST_FOOD", "CAFE", "BAR", "PUB" -> "RESTAURANT";
            case "HOSPITAL", "CLINIC", "DOCTORS" -> "HOSPITAL";
            case "PHARMACY" -> "PHARMACY";
            case "HOTEL", "MOTEL", "GUEST_HOUSE", "HOSTEL" -> "HOTEL";
            case "COLLEGE", "UNIVERSITY", "SCHOOL" -> "COLLEGE";
            case "PARK", "PITCH", "GARDEN" -> "PARK";
            case "FUEL", "CHARGING_STATION" -> "PETROL_STATION";
            case "BANK", "ATM" -> "BANK";
            case "SUPERMARKET", "MALL", "DEPARTMENT_STORE", "CONVENIENCE" -> "SHOP";
            default -> "LOCATION";
        };
    }

    private String mapPlaceType(String rawType) {
        return switch (rawType.toUpperCase()) {
            case "CITY", "TOWN", "VILLAGE", "HAMLET", "SUBURB" -> "CITY";
            case "ROAD", "STREET", "RESIDENTIAL", "MOTORWAY" -> "STREET";
            case "AMENITY", "SHOP", "TOURISM", "LEISURE" -> "POI";
            default -> "ADDRESS";
        };
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }

    private static class CacheEntry<T> {
        final T data;
        final long timestamp;

        CacheEntry(T data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
}
