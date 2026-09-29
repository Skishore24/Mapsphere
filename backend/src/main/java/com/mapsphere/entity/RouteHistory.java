package com.mapsphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "route_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "origin_name", length = 255)
    private String originName;

    @Column(name = "destination_name", length = 255)
    private String destinationName;

    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;

    private Double distanceMeters;
    private Double durationSeconds;

    @Column(name = "travel_mode", length = 20)
    private String travelMode; // DRIVING, WALKING, CYCLING

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
