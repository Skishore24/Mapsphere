package com.mapsphere.dto.route;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteRequest {

    @Valid
    @NotNull(message = "Origin coordinates are required")
    private Coordinates origin;

    @Valid
    @NotNull(message = "Destination coordinates are required")
    private Coordinates destination;

    private String originName;
    private String destinationName;

    @Builder.Default
    private String mode = "DRIVING"; // DRIVING, WALKING, CYCLING

    @Builder.Default
    private boolean avoidTolls = false;

    @Builder.Default
    private boolean avoidHighways = false;

    @Builder.Default
    private boolean avoidFerries = false;
}
