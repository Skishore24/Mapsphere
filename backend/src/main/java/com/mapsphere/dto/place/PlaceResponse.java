package com.mapsphere.dto.place;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceResponse {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String address;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String website;
    private Double rating;
    private LocalDateTime createdAt;
}
