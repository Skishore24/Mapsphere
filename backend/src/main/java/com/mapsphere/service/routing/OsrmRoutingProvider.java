package com.mapsphere.service.routing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.dto.route.RouteStep;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
public class OsrmRoutingProvider implements RoutingProvider {

    private static final Logger log = LoggerFactory.getLogger(OsrmRoutingProvider.class);

    @Value("${mapsphere.routing.osrm-url:https://router.project-osrm.org}")
    private String osrmBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

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

        String url = String.format("%s/route/v1/%s/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                osrmBaseUrl, profile, originLng, originLat, destLng, destLat);

        try {
            String json = restTemplate.getForObject(url, String.class);
            if (json != null) {
                JsonNode root = objectMapper.readTree(json);
                if ("Ok".equalsIgnoreCase(root.path("code").asText())) {
                    JsonNode routeNode = root.path("routes").get(0);
                    double distance = routeNode.path("distance").asDouble();
                    double duration = routeNode.path("duration").asDouble();

                    // Parse geometry: GeoJSON coordinates are [longitude, latitude] -> convert to [lat, lng] for Leaflet
                    List<List<Double>> geometry = new ArrayList<>();
                    JsonNode coords = routeNode.path("geometry").path("coordinates");
                    for (JsonNode point : coords) {
                        double lng = point.get(0).asDouble();
                        double lat = point.get(1).asDouble();
                        geometry.add(List.of(lat, lng));
                    }

                    // Parse turn-by-turn steps
                    List<RouteStep> steps = new ArrayList<>();
                    JsonNode legs = routeNode.path("legs");
                    if (legs.isArray() && !legs.isEmpty()) {
                        JsonNode stepNodes = legs.get(0).path("steps");
                        for (JsonNode s : stepNodes) {
                            String name = s.path("name").asText();
                            String maneuverType = s.path("maneuver").path("type").asText("turn");
                            String modifier = s.path("maneuver").path("modifier").asText("");
                            double stepDist = s.path("distance").asDouble();
                            double stepDur = s.path("duration").asDouble();

                            String instruction = buildInstruction(maneuverType, modifier, name);
                            steps.add(RouteStep.builder()
                                    .instruction(instruction)
                                    .distanceMeters(stepDist)
                                    .durationSeconds(stepDur)
                                    .modifier(modifier)
                                    .build());
                        }
                    }

                    return RouteResponse.builder()
                            .distanceMeters(distance)
                            .durationSeconds(duration)
                            .travelMode(request.getMode().toUpperCase())
                            .geometry(geometry)
                            .steps(steps)
                            .summary(formatSummary(distance, duration, request.getMode()))
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("OSRM routing failed: {}. Falling back to spherical direct line calculation.", e.getMessage());
        }

        // Resilient Fallback: Compute Great-Circle straight line route if external routing server fails
        return createFallbackRoute(request, originLat, originLng, destLat, destLng);
    }

    private String buildInstruction(String type, String modifier, String street) {
        String streetName = (street != null && !street.isEmpty()) ? " onto " + street : "";
        if ("depart".equalsIgnoreCase(type)) {
            return "Head out" + streetName;
        } else if ("arrive".equalsIgnoreCase(type)) {
            return "You have arrived at your destination";
        } else if ("turn".equalsIgnoreCase(type)) {
            return "Turn " + (modifier.isEmpty() ? "" : modifier + " ") + streetName;
        } else if ("new name".equalsIgnoreCase(type) || "continue".equalsIgnoreCase(type)) {
            return "Continue" + streetName;
        } else if ("roundabout".equalsIgnoreCase(type)) {
            return "Enter roundabout and take exit" + streetName;
        }
        return (type + " " + modifier + streetName).trim();
    }

    private String formatSummary(double distanceMeters, double durationSeconds, String mode) {
        double km = distanceMeters / 1000.0;
        long mins = Math.round(durationSeconds / 60.0);
        return String.format("%.1f km (%d min by %s)", km, mins, mode.toLowerCase());
    }

    private RouteResponse createFallbackRoute(RouteRequest request, double lat1, double lng1, double lat2, double lng2) {
        // Haversine direct distance
        double R = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;

        double speedKmh = switch (request.getMode().toUpperCase()) {
            case "WALKING" -> 5.0;
            case "CYCLING" -> 15.0;
            default -> 45.0; // Driving average
        };
        double duration = (distance / 1000.0) / speedKmh * 3600.0;

        List<List<Double>> geometry = List.of(
                List.of(lat1, lng1),
                List.of(lat2, lng2)
        );

        List<RouteStep> steps = List.of(
                RouteStep.builder().instruction("Depart origin").distanceMeters(distance / 2).durationSeconds(duration / 2).build(),
                RouteStep.builder().instruction("Arrive at destination").distanceMeters(distance / 2).durationSeconds(duration / 2).build()
        );

        return RouteResponse.builder()
                .distanceMeters(distance)
                .durationSeconds(duration)
                .travelMode(request.getMode().toUpperCase())
                .geometry(geometry)
                .steps(steps)
                .summary(formatSummary(distance, duration, request.getMode()))
                .build();
    }
}
