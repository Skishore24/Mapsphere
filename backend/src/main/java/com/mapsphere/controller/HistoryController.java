package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.entity.RouteHistory;
import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import com.mapsphere.exception.ResourceNotFoundException;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
public class HistoryController {

    private final HistoryService historyService;
    private final UserRepository userRepository;

    public HistoryController(HistoryService historyService, UserRepository userRepository) {
        this.historyService = historyService;
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<SearchHistory>>> getSearchHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(historyService.getSearchHistory(user)));
    }

    @DeleteMapping("/search/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSearchHistoryItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.deleteSearchHistoryItem(user, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Search history entry deleted"));
    }

    @DeleteMapping("/search")
    public ResponseEntity<ApiResponse<Void>> clearSearchHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.clearSearchHistory(user);
        return ResponseEntity.ok(ApiResponse.success(null, "Search history cleared"));
    }

    @GetMapping("/routes")
    public ResponseEntity<ApiResponse<List<RouteHistory>>> getRouteHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(historyService.getRouteHistory(user)));
    }

    @DeleteMapping("/routes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRouteHistoryItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.deleteRouteHistoryItem(user, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Route history entry deleted"));
    }

    @DeleteMapping("/routes")
    public ResponseEntity<ApiResponse<Void>> clearRouteHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.clearRouteHistory(user);
        return ResponseEntity.ok(ApiResponse.success(null, "Route history cleared"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
