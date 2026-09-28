package com.mapsphere.dto.history;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistoryResponse {
    private Long id;
    private String query;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
}
