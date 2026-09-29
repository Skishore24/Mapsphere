package com.mapsphere.dto.search;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchResult {
    private String id;
    private String name;
    private String displayName;
    private String address;
    private double latitude;
    private double longitude;
    private String category;
    private String type;         // DATABASE_PLACE, ADDRESS, CITY, STREET, POI
    private Double distance;     // Meters from user search origin (if provided)
    private Double importance;   // Relevance score (0.0 - 1.0)
    private String phone;
    private String website;
    private String openingHours;
    private String source;       // DATABASE or NOMINATIM
    private Long placeId;        // Present if matched a database entity
}
