package com.mapsphere.dto.history;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteHistoryResponse {
    private Long id;
    private String startLocation;
    private String destinationLocation;
    private Double distance;
    private Integer duration;
    private String travelMode;
    private LocalDateTime createdAt;
}
