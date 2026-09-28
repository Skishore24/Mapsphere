package com.mapsphere.service;

import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.entity.RouteHistory;
import com.mapsphere.entity.User;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.service.routing.RoutingProvider;
import org.springframework.stereotype.Service;

@Service
public class RouteService {

    private final RoutingProvider routingProvider;
    private final RouteHistoryRepository routeHistoryRepository;

    public RouteService(RoutingProvider routingProvider, RouteHistoryRepository routeHistoryRepository) {
        this.routingProvider = routingProvider;
        this.routeHistoryRepository = routeHistoryRepository;
    }

    public RouteResponse calculateRoute(RouteRequest request, User user) {
        RouteResponse response = routingProvider.calculateRoute(request);

        if (user != null) {
            routeHistoryRepository.save(RouteHistory.builder()
                    .user(user)
                    .originName(request.getOriginName() != null ? request.getOriginName() : "Origin")
                    .destinationName(request.getDestinationName() != null ? request.getDestinationName() : "Destination")
                    .originLat(request.getOrigin().getLatitude())
                    .originLng(request.getOrigin().getLongitude())
                    .destinationLat(request.getDestination().getLatitude())
                    .destinationLng(request.getDestination().getLongitude())
                    .distanceMeters(response.getDistanceMeters())
                    .durationSeconds(response.getDurationSeconds())
                    .travelMode(response.getTravelMode())
                    .build());
        }

        return response;
    }
}
