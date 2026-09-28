package com.mapsphere.dto.favorite;

import com.mapsphere.dto.place.PlaceResponse;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteResponse {
    private Long id;
    private String customName;
    private String category;
    private PlaceResponse place;
    private LocalDateTime createdAt;
}
