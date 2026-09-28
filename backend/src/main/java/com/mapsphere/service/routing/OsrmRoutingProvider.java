package com.mapsphere.service.routing;

import com.mapsphere.dto.route.Coordinates;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.dto.route.RouteStep;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class OsrmRoutingProvider implements RoutingProvider {

    private final RestTemplate restTemplate;

    public OsrmRoutingProvider(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(4))
                .setReadTimeout(Duration.ofSeconds(4))
                .build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public RouteResponse calculateRoute(Coordinates origin, Coordinates destination, String mode) {
        String profile = "driving";
        if ("WALKING".equalsIgnoreCase(mode)) {
            profile = "foot";
        } else if ("CYCLING".equalsIgnoreCase(mode)) {
            profile = "bike";
        }

        String url = String.format(
                "https://router.project-osrm.org/route/v1/%s/%f,%f;%f,%f?overview=full&geometries=geojson&steps=true",
                profile,
                origin.getLongitude(), origin.getLatitude(),
                destination.getLongitude(), destination.getLatitude()
        );

        try {
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && "Ok".equalsIgnoreCase((String) response.get("code"))) {
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                if (routes != null && !routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    Number distanceNum = (Number) route.get("distance");
                    Number durationNum = (Number) route.get("duration");

                    double distanceMeters = distanceNum.doubleValue();
                    int durationSeconds = durationNum.intValue();

                    // Extract coordinates from GeoJSON LineString geometry
                    Map<String, Object> geometryMap = (Map<String, Object>) route.get("geometry");
                    List<List<Number>> coords = (List<List<Number>>) geometryMap.get("coordinates");

                    List<List<Double>> latLngList = new ArrayList<>();
                    for (List<Number> c : coords) {
                        // GeoJSON is [lng, lat] -> convert to [lat, lng] for Leaflet
                        latLngList.add(List.of(c.get(1).doubleValue(), c.get(0).doubleValue()));
                    }

                    // Extract navigation steps
                    List<RouteStep> steps = new ArrayList<>();
                    List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");
                    if (legs != null && !legs.isEmpty()) {
                        List<Map<String, Object>> rawSteps = (List<Map<String, Object>>) legs.get(0).get("steps");
                        for (Map<String, Object> s : rawSteps) {
                            Map<String, Object> maneuver = (Map<String, Object>) s.get("maneuver");
                            String type = maneuver != null ? (String) maneuver.get("type") : "continue";
                            String modifier = maneuver != null ? (String) maneuver.get("modifier") : "";
                            String streetName = (String) s.get("name");

                            String instruction = buildInstruction(type, modifier, streetName);
                            Number stepDist = (Number) s.get("distance");
                            Number stepDur = (Number) s.get("duration");

                            steps.add(RouteStep.builder()
                                    .instruction(instruction)
                                    .name(streetName != null && !streetName.isBlank() ? streetName : "Unnamed Road")
                                    .distanceMeters(stepDist != null ? stepDist.doubleValue() : 0.0)
                                    .durationSeconds(stepDur != null ? stepDur.intValue() : 0)
                                    .build());
                        }
                    }

                    return RouteResponse.builder()
                            .distanceMeters(distanceMeters)
                            .durationSeconds(durationSeconds)
                            .formattedDistance(formatDistance(distanceMeters))
                            .formattedDuration(formatDuration(durationSeconds))
                            .travelMode(mode.toUpperCase())
                            .geometry(latLngList)
                            .steps(steps)
                            .build();
                }
            }
        } catch (Exception e) {
            // Fallback to geometric direct route if OSRM is unreachable
        }

        return fallbackGeometricRoute(origin, destination, mode);
    }

    private String buildInstruction(String type, String modifier, String name) {
        String street = (name != null && !name.isBlank()) ? " on " + name : "";
        if ("depart".equalsIgnoreCase(type)) {
            return "Head " + (modifier != null ? modifier : "forward") + street;
        } else if ("arrive".equalsIgnoreCase(type)) {
            return "You have arrived at your destination";
        } else if ("turn".equalsIgnoreCase(type)) {
            return "Turn " + (modifier != null ? modifier : "") + street;
        } else if ("new name".equalsIgnoreCase(type)) {
            return "Continue" + street;
        }
        return "Continue " + (modifier != null ? modifier : "straight") + street;
    }

    private RouteResponse fallbackGeometricRoute(Coordinates origin, Coordinates destination, String mode) {
        double distance = calculateHaversineDistance(
                origin.getLatitude(), origin.getLongitude(),
                destination.getLatitude(), destination.getLongitude()
        );

        double speedKmh = switch (mode.toUpperCase()) {
            case "WALKING" -> 4.5;
            case "CYCLING" -> 15.0;
            default -> 45.0; // DRIVING
        };

        int durationSeconds = (int) ((distance / 1000.0 / speedKmh) * 3600);

        List<List<Double>> geometry = List.of(
                List.of(origin.getLatitude(), origin.getLongitude()),
                List.of(
                        (origin.getLatitude() + destination.getLatitude()) / 2,
                        (origin.getLongitude() + destination.getLongitude()) / 2
                ),
                List.of(destination.getLatitude(), destination.getLongitude())
        );

        List<RouteStep> steps = List.of(
                RouteStep.builder()
                        .instruction("Head toward destination")
                        .distanceMeters(distance * 0.7)
                        .durationSeconds((int) (durationSeconds * 0.7))
                        .name("Direct Route")
                        .build(),
                RouteStep.builder()
                        .instruction("Arrive at destination")
                        .distanceMeters(distance * 0.3)
                        .durationSeconds((int) (durationSeconds * 0.3))
                        .name("Destination")
                        .build()
        );

        return RouteResponse.builder()
                .distanceMeters(distance)
                .durationSeconds(durationSeconds)
                .formattedDistance(formatDistance(distance))
                .formattedDuration(formatDuration(durationSeconds))
                .travelMode(mode.toUpperCase())
                .geometry(geometry)
                .steps(steps)
                .build();
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String formatDistance(double meters) {
        if (meters >= 1000) {
            return String.format("%.1f km", meters / 1000.0);
        }
        return String.format("%.0f m", meters);
    }

    private String formatDuration(int seconds) {
        int mins = seconds / 60;
        int hours = mins / 60;
        if (hours > 0) {
            return String.format("%d hr %d min", hours, mins % 60);
        }
        return String.format("%d min", Math.max(1, mins));
    }
}
