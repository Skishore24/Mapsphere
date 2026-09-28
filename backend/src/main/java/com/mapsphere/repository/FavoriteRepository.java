package com.mapsphere.repository;

import com.mapsphere.entity.Favorite;
import com.mapsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserOrderByCreatedAtDesc(User user);
    Optional<Favorite> findByUserAndPlaceId(User user, Long placeId);
    boolean existsByUserAndPlaceId(User user, Long placeId);
    void deleteByUserAndPlaceId(User user, Long placeId);
}
