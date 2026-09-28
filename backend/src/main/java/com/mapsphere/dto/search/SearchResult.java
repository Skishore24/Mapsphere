package com.mapsphere.dto.search;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResult {
    private String name;
    private String displayName;
    private double latitude;
    private double longitude;
    private String category;
    private String type; // "DATABASE_PLACE" or "GEOCODED_ADDRESS"
    private Long placeId;
}
