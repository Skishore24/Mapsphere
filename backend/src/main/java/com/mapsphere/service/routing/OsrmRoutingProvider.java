package com.mapsphere.service.routing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.dto.route.RouteStep;
import com.mapsphere.exception.RoutingUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OsrmRoutingProvider implements RoutingProvider {

    private static final Logger log = LoggerFactory.getLogger(OsrmRoutingProvider.class);

    @Value("${mapsphere.routing.osrm-url:https://router.project-osrm.org}")
    private String osrmBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Short-lived in-memory route cache (10 minutes TTL)
    private final Map<String, CachedRoute> routeCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 10 * 60 * 1000;

    public OsrmRoutingProvider() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public RouteResponse calculateRoute(RouteRequest request) {
        String profile = switch (request.getMode().toUpperCase()) {
            case "WALKING" -> "foot";
            case "CYCLING" -> "bike";
            default -> "driving";
        };

        double originLng = request.getOrigin().getLongitude();
        double originLat = request.getOrigin().getLatitude();
        double destLng = request.getDestination().getLongitude();
        double destLat = request.getDestination().getLatitude();

        // Check Cache
        String cacheKey = String.format(Locale.US, "%.5f,%.5f:%.5f,%.5f:%s:%b:%b:%b",
                originLat, originLng, destLat, destLng, profile,
                request.isAvoidTolls(), request.isAvoidHighways(), request.isAvoidFerries());

        CachedRoute cached = routeCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            log.debug("Serving route from cache: {}", cacheKey);
            return cached.response;
        }

        // Build OSRM request URL
        String url = String.format(Locale.US,
                "%s/route/v1/%s/%.6f,%.6f;%.6f,%.6f?overview=full&geometries=geojson&steps=true&alternatives=true",
                osrmBaseUrl, profile, originLng, originLat, destLng, destLat);

        try {
            log.info("Requesting route from OSRM: mode={}, origin=[{},{}], dest=[{},{}]",
                    profile, originLat, originLng, destLat, destLng);

            String json = restTemplate.getForObject(url, String.class);
            if (json == null || json.isBlank()) {
                throw new RoutingUnavailableException("Routing service returned an empty response");
            }

            JsonNode root = objectMapper.readTree(json);
            String code = root.path("code").asText("");

            if (!"Ok".equalsIgnoreCase(code)) {
                String message = root.path("message").asText("No navigable route found");
                log.warn("OSRM returned non-OK status: code={}, message={}", code, message);
                throw new RoutingUnavailableException("No navigable road route found: " + message);
            }

            JsonNode routesNode = root.path("routes");
            if (!routesNode.isArray() || routesNode.isEmpty()) {
                throw new RoutingUnavailableException("No viable road connection between selected points");
            }

            // Primary Route
            RouteResponse primaryRoute = parseSingleRoute(routesNode.get(0), request.getMode());

            // Alternative routes if returned
            if (routesNode.size() > 1) {
                List<RouteResponse> alternatives = new ArrayList<>();
                for (int i = 1; i < routesNode.size(); i++) {
                    alternatives.add(parseSingleRoute(routesNode.get(i), request.getMode()));
                }
                primaryRoute.setAlternatives(alternatives);
            }

            // Store in cache
            routeCache.put(cacheKey, new CachedRoute(primaryRoute));

            return primaryRoute;

        } catch (RoutingUnavailableException rue) {
            throw rue;
        } catch (Exception e) {
            log.error("OSRM routing failure: {}", e.getMessage());
            throw new RoutingUnavailableException(
                    "Routing service is temporarily unavailable or unreachable. Please try again in a few moments."
            );
        }
    }

    private RouteResponse parseSingleRoute(JsonNode routeNode, String mode) {
        double distance = routeNode.path("distance").asDouble();
        double duration = routeNode.path("duration").asDouble();

        // Geometry: convert GeoJSON [lng, lat] to Leaflet-friendly [lat, lng]
        List<List<Double>> geometry = new ArrayList<>();
        JsonNode coords = routeNode.path("geometry").path("coordinates");
        for (JsonNode point : coords) {
            double lng = point.get(0).asDouble();
            double lat = point.get(1).asDouble();
            geometry.add(List.of(lat, lng));
        }

        // Steps parsing with structured maneuver model
        List<RouteStep> steps = new ArrayList<>();
        JsonNode legs = routeNode.path("legs");
        if (legs.isArray() && !legs.isEmpty()) {
            JsonNode stepNodes = legs.get(0).path("steps");
            for (JsonNode s : stepNodes) {
                String name = s.path("name").asText("").trim();
                JsonNode maneuverNode = s.path("maneuver");
                String rawType = maneuverNode.path("type").asText("turn").toLowerCase();
                String rawModifier = maneuverNode.path("modifier").asText("").toLowerCase();
                double stepDist = s.path("distance").asDouble();
                double stepDur = s.path("duration").asDouble();

                String maneuverType = mapManeuverType(rawType);
                String modifier = mapModifier(rawModifier);

                // Coordinates of step
                List<Double> startCoord = null;
                JsonNode locNode = maneuverNode.path("location");
                if (locNode.isArray() && locNode.size() >= 2) {
                    startCoord = List.of(locNode.get(1).asDouble(), locNode.get(0).asDouble());
                }

                String instruction = buildInstruction(maneuverType, modifier, name);

                steps.add(RouteStep.builder()
                        .instruction(instruction)
                        .maneuverType(maneuverType)
                        .modifier(modifier)
                        .roadName(name.isEmpty() ? null : name)
                        .distanceMeters(stepDist)
                        .durationSeconds(stepDur)
                        .startCoordinate(startCoord)
                        .build());
            }
        }

        return RouteResponse.builder()
                .distanceMeters(distance)
                .durationSeconds(duration)
                .travelMode(mode.toUpperCase())
                .geometry(geometry)
                .steps(steps)
                .summary(formatSummary(distance, duration, mode))
                .build();
    }

    private String mapManeuverType(String raw) {
        return switch (raw) {
            case "depart" -> "DEPART";
            case "arrive" -> "ARRIVE";
            case "turn" -> "TURN";
            case "new name", "continue" -> "CONTINUE";
            case "merge" -> "MERGE";
            case "roundabout", "rotary" -> "ROUNDABOUT";
            case "fork" -> "FORK";
            case "on ramp" -> "ON_RAMP";
            case "off ramp" -> "OFF_RAMP";
            case "end of road" -> "TURN";
            case "use lane" -> "CONTINUE";
            default -> "TURN";
        };
    }

    private String mapModifier(String raw) {
        return switch (raw) {
            case "left" -> "LEFT";
            case "right" -> "RIGHT";
            case "slight left" -> "SLIGHT_LEFT";
            case "slight right" -> "SLIGHT_RIGHT";
            case "sharp left" -> "SHARP_LEFT";
            case "sharp right" -> "SHARP_RIGHT";
            case "straight" -> "STRAIGHT";
            case "u-turn", "uturn" -> "UTURN";
            default -> "";
        };
    }

    private String buildInstruction(String maneuverType, String modifier, String street) {
        String streetSuffix = (street != null && !street.isEmpty()) ? " onto " + street : "";

        return switch (maneuverType) {
            case "DEPART" -> "Head out" + streetSuffix;
            case "ARRIVE" -> "You will arrive at your destination" + (street != null && !street.isEmpty() ? " on " + street : "");
            case "CONTINUE" -> "Continue straight" + streetSuffix;
            case "MERGE" -> "Merge" + streetSuffix;
            case "ROUNDABOUT" -> "Enter the roundabout and take exit" + streetSuffix;
            case "FORK" -> "Keep " + (modifier.isEmpty() ? "ahead" : modifier.toLowerCase()) + " at the fork" + streetSuffix;
            case "ON_RAMP" -> "Take the ramp" + streetSuffix;
            case "OFF_RAMP" -> "Take the exit ramp" + streetSuffix;
            case "TURN" -> {
                String modDesc = switch (modifier) {
                    case "LEFT" -> "left";
                    case "RIGHT" -> "right";
                    case "SLIGHT_LEFT" -> "slight left";
                    case "SLIGHT_RIGHT" -> "slight right";
                    case "SHARP_LEFT" -> "sharp left";
                    case "SHARP_RIGHT" -> "sharp right";
                    case "UTURN" -> "a U-turn";
                    default -> "ahead";
                };
                yield "Turn " + modDesc + streetSuffix;
            }
            default -> "Proceed" + streetSuffix;
        };
    }

    private String formatSummary(double distanceMeters, double durationSeconds, String mode) {
        double km = distanceMeters / 1000.0;
        long totalSeconds = Math.round(durationSeconds);
        long hours = totalSeconds / 3600;
        long mins = (totalSeconds % 3600) / 60;

        String timeStr;
        if (hours > 0) {
            timeStr = String.format("%d hr %d min", hours, mins);
        } else {
            timeStr = String.format("%d min", Math.max(1, mins));
        }

        return String.format(Locale.US, "%.1f km · %s (%s)", km, timeStr, mode.toLowerCase());
    }

    private static class CachedRoute {
        final RouteResponse response;
        final long createdAt;

        CachedRoute(RouteResponse response) {
            this.response = response;
            this.createdAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > CACHE_TTL_MS;
        }
    }
}
