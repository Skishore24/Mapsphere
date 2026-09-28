package com.mapsphere.dto.route;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteResponse {
    private double distanceMeters;
    private double durationSeconds;
    private String travelMode;
    // List of [latitude, longitude] pairs for polyline drawing
    private List<List<Double>> geometry;
    private List<RouteStep> steps;
    private String summary;
}
