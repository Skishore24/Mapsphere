package com.mapsphere.dto.route;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStep {
    private String instruction;
    private double distanceMeters;
    private double durationSeconds;
    private String modifier;
}
