package com.mapsphere.dto.route;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStep {
    private String instruction;
    private String maneuverType; // DEPART, ARRIVE, TURN, CONTINUE, MERGE, ROUNDABOUT, FORK, ON_RAMP, OFF_RAMP, U_TURN, NEW_NAME
    private String modifier;     // LEFT, RIGHT, SLIGHT_LEFT, SLIGHT_RIGHT, SHARP_LEFT, SHARP_RIGHT, STRAIGHT, UTURN
    private String roadName;
    private double distanceMeters;
    private double durationSeconds;
    private List<Double> startCoordinate; // [lat, lng]
    private List<Double> endCoordinate;   // [lat, lng]
}
