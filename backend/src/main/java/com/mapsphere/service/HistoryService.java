package com.mapsphere.service;

import com.mapsphere.dto.history.RouteHistoryResponse;
import com.mapsphere.dto.history.SearchHistoryResponse;
import com.mapsphere.entity.User;
import com.mapsphere.repository.RouteHistoryRepository;
import com.mapsphere.repository.SearchHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HistoryService {

    private final SearchHistoryRepository searchHistoryRepository;
    private final RouteHistoryRepository routeHistoryRepository;

    public HistoryService(SearchHistoryRepository searchHistoryRepository, RouteHistoryRepository routeHistoryRepository) {
        this.searchHistoryRepository = searchHistoryRepository;
        this.routeHistoryRepository = routeHistoryRepository;
    }

    public List<SearchHistoryResponse> getSearchHistory(User user) {
        return searchHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(s -> SearchHistoryResponse.builder()
                        .id(s.getId())
                        .query(s.getQuery())
                        .latitude(s.getLatitude())
                        .longitude(s.getLongitude())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void clearSearchHistory(User user) {
        searchHistoryRepository.deleteByUserId(user.getId());
    }

    public List<RouteHistoryResponse> getRouteHistory(User user) {
        return routeHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(r -> RouteHistoryResponse.builder()
                        .id(r.getId())
                        .startLocation(r.getStartLocation())
                        .destinationLocation(r.getDestinationLocation())
                        .distance(r.getDistance())
                        .duration(r.getDuration())
                        .travelMode(r.getTravelMode())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void clearRouteHistory(User user) {
        routeHistoryRepository.deleteByUserId(user.getId());
    }
}
