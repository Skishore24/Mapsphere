package com.mapsphere.service;

import com.mapsphere.dto.user.UserResponse;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import com.mapsphere.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final RouteHistoryRepository routeHistoryRepository;
    private final SearchHistoryRepository searchHistoryRepository;

    public AdminService(
            UserRepository userRepository,
            PlaceRepository placeRepository,
            RouteHistoryRepository routeHistoryRepository,
            SearchHistoryRepository searchHistoryRepository
    ) {
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
        this.routeHistoryRepository = routeHistoryRepository;
        this.searchHistoryRepository = searchHistoryRepository;
    }

    public Map<String, Object> getSystemStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPlaces", placeRepository.count());
        stats.put("totalRoutesCalculated", routeHistoryRepository.count());
        stats.put("totalSearches", searchHistoryRepository.count());
        stats.put("databaseStatus", "ONLINE");
        stats.put("systemStatus", "HEALTHY");
        return stats;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .createdAt(u.getCreatedAt())
                        .build())
                .toList();
    }
}
