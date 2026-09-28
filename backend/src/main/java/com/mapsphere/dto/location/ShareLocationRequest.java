package com.mapsphere.dto.location;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLocationRequest {
    @Builder.Default
    private int durationMinutes = 60; // Default 1 hour
}
