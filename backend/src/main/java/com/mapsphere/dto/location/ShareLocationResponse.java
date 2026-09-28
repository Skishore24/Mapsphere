package com.mapsphere.dto.location;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareLocationResponse {
    private String shareId;
    private LocalDateTime expiresAt;
    private boolean active;
    private Double lastLatitude;
    private Double lastLongitude;
    private Double accuracy;
    private Double heading;
    private Double speed;
}
