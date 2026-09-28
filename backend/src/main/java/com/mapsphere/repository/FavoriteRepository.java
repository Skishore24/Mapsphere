package com.mapsphere.repository;

import com.mapsphere.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndPlaceId(Long userId, Long placeId);
    boolean existsByUserIdAndPlaceId(Long userId, Long placeId);
    void deleteByUserIdAndId(Long userId, Long id);
}
