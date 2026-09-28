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
     * Note: In PostGIS, ST_MakePoint takes (X, Y) which is (longitude, latitude).
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
        """, nativeQuery = true)
    List<Place> findNearbyPlaces(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusMeters") double radiusMeters
    );
}
