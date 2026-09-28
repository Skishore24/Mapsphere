package com.mapsphere.dto.location;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveLocationUpdate {

    @NotBlank(message = "Share ID is required")
    private String shareId;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private Double accuracy;

    private Double heading;

    private Double speed;

    private Long timestamp;
}
