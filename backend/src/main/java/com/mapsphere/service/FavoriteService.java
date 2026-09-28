package com.mapsphere.service;

import com.mapsphere.entity.Favorite;
import com.mapsphere.entity.Place;
import com.mapsphere.entity.User;
import com.mapsphere.exception.BadRequestException;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.FavoriteRepository;
import com.mapsphere.repository.PlaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    public List<Map<String, Object>> getUserFavorites(User user) {
        return favoriteRepository.findByUserOrderByCreatedAtDesc(user).stream().map(fav -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", fav.getId());
            map.put("customName", fav.getCustomName() != null ? fav.getCustomName() : fav.getPlace().getName());
            map.put("tag", fav.getTag() != null ? fav.getTag() : "FAVORITE");
            map.put("place", placeService.toDto(fav.getPlace()));
            map.put("createdAt", fav.getCreatedAt());
            return map;
        }).toList();
    }

    @Transactional
    public Map<String, Object> addFavorite(User user, Long placeId, String customName, String tag) {
        if (favoriteRepository.existsByUserAndPlaceId(user, placeId)) {
            throw new BadRequestException("Place is already in your saved places");
        }

        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResourceNotFoundException("Place not found with id: " + placeId));

        Favorite favorite = Favorite.builder()
                .user(user)
                .place(place)
                .customName(customName != null && !customName.isBlank() ? customName : place.getName())
                .tag(tag != null ? tag.toUpperCase() : "FAVORITE")
                .build();

        Favorite saved = favoriteRepository.save(favorite);

        Map<String, Object> map = new HashMap<>();
        map.put("id", saved.getId());
        map.put("customName", saved.getCustomName());
        map.put("tag", saved.getTag());
        map.put("place", placeService.toDto(saved.getPlace()));
        return map;
    }

    @Transactional
    public void removeFavorite(User user, Long placeId) {
        favoriteRepository.deleteByUserAndPlaceId(user, placeId);
    }
}
