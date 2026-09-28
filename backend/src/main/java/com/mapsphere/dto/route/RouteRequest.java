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

    @Builder.Default
    private String mode = "DRIVING";
}
