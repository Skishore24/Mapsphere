package com.mapsphere.dto.search;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResult {
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String category;
    private String source;
    private Long placeId;
}
