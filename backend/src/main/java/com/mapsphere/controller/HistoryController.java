package com.mapsphere.controller;

import com.mapsphere.dto.history.RouteHistoryResponse;
import com.mapsphere.dto.history.SearchHistoryResponse;
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
    public ResponseEntity<List<SearchHistoryResponse>> getSearchHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(historyService.getSearchHistory(user));
    }

    @DeleteMapping("/search")
    public ResponseEntity<Void> clearSearchHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.clearSearchHistory(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/routes")
    public ResponseEntity<List<RouteHistoryResponse>> getRouteHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(historyService.getRouteHistory(user));
    }

    @DeleteMapping("/routes")
    public ResponseEntity<Void> clearRouteHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        historyService.clearRouteHistory(user);
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
