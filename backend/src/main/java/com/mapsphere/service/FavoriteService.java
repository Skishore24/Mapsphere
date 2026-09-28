package com.mapsphere.service;

import com.mapsphere.dto.favorite.FavoriteRequest;
import com.mapsphere.dto.favorite.FavoriteResponse;
import com.mapsphere.entity.Favorite;
import com.mapsphere.entity.Place;
import com.mapsphere.entity.User;
import com.mapsphere.exception.BadRequestException;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.FavoriteRepository;
import com.mapsphere.repository.PlaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PlaceRepository placeRepository;
    private final PlaceService placeService;

    public FavoriteService(FavoriteRepository favoriteRepository, PlaceRepository placeRepository, PlaceService placeService) {
        this.favoriteRepository = favoriteRepository;
        this.placeRepository = placeRepository;
        this.placeService = placeService;
    }

    public List<FavoriteResponse> getFavorites(User user) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FavoriteResponse addFavorite(User user, FavoriteRequest request) {
        if (favoriteRepository.existsByUserIdAndPlaceId(user.getId(), request.getPlaceId())) {
            throw new BadRequestException("Place is already in your favorites");
        }

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + request.getPlaceId()));

        Favorite favorite = Favorite.builder()
                .user(user)
                .place(place)
                .customName(request.getCustomName())
                .category(request.getCategory() != null ? request.getCategory() : "Favorite")
                .build();

        return toResponse(favoriteRepository.save(favorite));
    }

    @Transactional
    public void removeFavorite(User user, Long id) {
        Favorite favorite = favoriteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite not found with id: " + id));

        if (!favorite.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to delete this favorite");
        }

        favoriteRepository.delete(favorite);
    }

    private FavoriteResponse toResponse(Favorite f) {
        return FavoriteResponse.builder()
                .id(f.getId())
                .customName(f.getCustomName())
                .category(f.getCategory())
                .place(placeService.toResponse(f.getPlace()))
                .createdAt(f.getCreatedAt())
                .build();
    }
}
