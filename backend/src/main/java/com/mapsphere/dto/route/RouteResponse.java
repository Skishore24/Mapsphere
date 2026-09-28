package com.mapsphere.dto.route;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteResponse {
    private Double distanceMeters;
    private Integer durationSeconds;
    private String formattedDistance;
    private String formattedDuration;
    private String travelMode;
    private List<List<Double>> geometry;
    private List<RouteStep> steps;
}
