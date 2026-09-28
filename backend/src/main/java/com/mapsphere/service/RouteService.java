package com.mapsphere.service;

import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.entity.RouteHistory;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.routing.RoutingProvider;
import org.springframework.stereotype.Service;

@Service
public class RouteService {

    private final RoutingProvider routingProvider;
    private final RouteHistoryRepository routeHistoryRepository;
    private final UserRepository userRepository;

    public RouteService(
            RoutingProvider routingProvider,
            RouteHistoryRepository routeHistoryRepository,
            UserRepository userRepository
    ) {
        this.routingProvider = routingProvider;
        this.routeHistoryRepository = routeHistoryRepository;
        this.userRepository = userRepository;
    }

    public RouteResponse calculateRoute(RouteRequest request, String userEmail) {
        RouteResponse response = routingProvider.calculateRoute(
                request.getOrigin(),
                request.getDestination(),
                request.getMode()
        );

        if (userEmail != null && !userEmail.isBlank()) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                String startDesc = String.format("%.4f, %.4f", request.getOrigin().getLatitude(), request.getOrigin().getLongitude());
                String destDesc = String.format("%.4f, %.4f", request.getDestination().getLatitude(), request.getDestination().getLongitude());

                routeHistoryRepository.save(RouteHistory.builder()
                        .user(user)
                        .startLocation(startDesc)
                        .destinationLocation(destDesc)
                        .distance(response.getDistanceMeters())
                        .duration(response.getDurationSeconds())
                        .travelMode(request.getMode().toUpperCase())
                        .build());
            });
        }

        return response;
    }
}
