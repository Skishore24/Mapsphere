package com.mapsphere.dto.place;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String address;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String phone;

    private String website;

    private Double rating;
}
