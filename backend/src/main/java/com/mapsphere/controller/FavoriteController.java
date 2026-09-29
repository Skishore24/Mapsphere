package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteService favoriteService, UserRepository userRepository) {
        this.favoriteService = favoriteService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(favoriteService.getUserFavorites(user)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addFavorite(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        Long placeId = ((Number) body.get("placeId")).longValue();
        String customName = (String) body.get("customName");
        String tag = (String) body.get("tag");

        Map<String, Object> created = favoriteService.addFavorite(user, placeId, customName, tag);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Place added to favorites"));
    }

    @DeleteMapping("/{placeId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable Long placeId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        favoriteService.removeFavorite(user, placeId);
        return ResponseEntity.ok(ApiResponse.success(null, "Favorite removed"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
