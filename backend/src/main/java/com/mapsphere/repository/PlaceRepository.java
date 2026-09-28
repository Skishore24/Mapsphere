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
     * Finds places within a radius (in meters) of (lat, lng) using PostGIS ST_DWithin.
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
        LIMIT 100
        """, nativeQuery = true)
    List<Place> findNearbyPlaces(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusMeters") double radiusMeters
    );

    /**
     * Viewport Bounding Box query: Returns places strictly visible within current map screen.
     * ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326)
     */
    @Query(value = """
        SELECT * FROM places p
        WHERE p.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
        LIMIT 200
        """, nativeQuery = true)
    List<Place> findInBoundingBox(
        @Param("minLat") double minLat,
        @Param("minLng") double minLng,
        @Param("maxLat") double maxLat,
        @Param("maxLng") double maxLng
    );

    List<Place> findByCategoryIgnoreCase(String category);

    @Query("SELECT p FROM Place p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.address) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Place> searchByKeyword(@Param("query") String query);
}
