package com.mapsphere.websocket;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationMessage {
    private String shareId;
    private double latitude;
    private double longitude;
    private Double accuracy;
    private Double heading;
    private Double speed;
    private String timestamp;
}
