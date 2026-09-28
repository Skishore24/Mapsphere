package com.mapsphere.controller;

import com.mapsphere.dto.favorite.FavoriteRequest;
import com.mapsphere.dto.favorite.FavoriteResponse;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.FavoriteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<FavoriteResponse>> getFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(favoriteService.getFavorites(user));
    }

    @PostMapping
    public ResponseEntity<FavoriteResponse> addFavorite(
            @Valid @RequestBody FavoriteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(favoriteService.addFavorite(user, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        favoriteService.removeFavorite(user, id);
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
