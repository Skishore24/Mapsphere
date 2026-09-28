package com.mapsphere.dto.route;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteStep {
    private String instruction;
    private Double distanceMeters;
    private Integer durationSeconds;
    private String name;
}
