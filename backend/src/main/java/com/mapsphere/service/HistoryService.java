package com.mapsphere.service;

import com.mapsphere.entity.RouteHistory;
import com.mapsphere.entity.SearchHistory;
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

    public List<SearchHistory> getSearchHistory(User user) {
        return searchHistoryRepository.findTop20ByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void clearSearchHistory(User user) {
        searchHistoryRepository.deleteByUser(user);
    }

    public List<RouteHistory> getRouteHistory(User user) {
        return routeHistoryRepository.findTop20ByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void clearRouteHistory(User user) {
        routeHistoryRepository.deleteByUser(user);
    }
}
