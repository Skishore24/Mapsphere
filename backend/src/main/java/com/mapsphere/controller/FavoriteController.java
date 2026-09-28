package com.mapsphere.controller;

import com.mapsphere.entity.User;
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
    public ResponseEntity<List<Map<String, Object>>> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(favoriteService.getUserFavorites(user));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> addFavorite(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Long placeId = ((Number) body.get("placeId")).longValue();
        String customName = (String) body.get("customName");
        String tag = (String) body.get("tag");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(favoriteService.addFavorite(user, placeId, customName, tag));
    }

    @DeleteMapping("/{placeId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long placeId,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        favoriteService.removeFavorite(user, placeId);
        return ResponseEntity.noContent().build();
    }
}
