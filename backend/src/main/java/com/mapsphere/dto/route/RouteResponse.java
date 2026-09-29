package com.mapsphere.dto.route;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RouteResponse {
    private double distanceMeters;
    private double durationSeconds;
    private String travelMode;
    // List of [latitude, longitude] pairs for polyline drawing
    private List<List<Double>> geometry;
    private List<RouteStep> steps;
    private String summary;
    private List<RouteResponse> alternatives;
}
