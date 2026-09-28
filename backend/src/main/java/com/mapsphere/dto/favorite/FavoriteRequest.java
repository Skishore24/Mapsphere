package com.mapsphere.dto.favorite;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteRequest {
    @NotNull(message = "Place ID is required")
    private Long placeId;
    private String customName;
    @Builder.Default
    private String category = "Favorite";
}
