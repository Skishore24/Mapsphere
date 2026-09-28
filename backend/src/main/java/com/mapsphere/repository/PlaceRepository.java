package com.mapsphere.repository;

import com.mapsphere.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

    /**
     * Radial nearby search using PostGIS ST_DWithin on spherical geography.
     */
    @Query(value = """
        SELECT * FROM places p
        WHERE ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
        )
        ORDER BY ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Place> findNearbyPlaces(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusMeters") double radiusMeters,
        @Param("limit") int limit
    );

    /**
     * Viewport Bounding-Box query: returns places strictly within map viewport.
     * Uses ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326) and spatial && operator.
     */
    @Query(value = """
        SELECT * FROM places p
        WHERE p.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
        LIMIT :limit
        """, nativeQuery = true)
    List<Place> findInBoundingBox(
        @Param("minLat") double minLat,
        @Param("minLng") double minLng,
        @Param("maxLat") double maxLat,
        @Param("maxLng") double maxLng,
        @Param("limit") int limit
    );

    /**
     * Deterministic place name, category, or address keyword search.
     */
    @Query(value = """
        SELECT * FROM places p
        WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.address) LIKE LOWER(CONCAT('%', :query, '%'))
        LIMIT 20
        """, nativeQuery = true)
    List<Place> searchByQuery(@Param("query") String query);

    List<Place> findByCategoryIgnoreCase(String category);
}
