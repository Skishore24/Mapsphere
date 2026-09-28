package com.mapsphere.entity;

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
    private User user;

    @Column(name = "start_location", nullable = false, length = 255)
    private String startLocation;

    @Column(name = "destination_location", nullable = false, length = 255)
    private String destinationLocation;

    private Double distance;

    private Integer duration;

    @Column(name = "travel_mode", length = 30)
    private String travelMode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
