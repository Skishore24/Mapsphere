package com.mapsphere.controller;

import com.mapsphere.dto.common.ApiResponse;
import com.mapsphere.dto.search.SearchResult;
import com.mapsphere.entity.User;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;
    private final UserRepository userRepository;

    public SearchController(SearchService searchService, UserRepository userRepository) {
        this.searchService = searchService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SearchResult>>> search(
            @RequestParam String q,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }

        List<SearchResult> results = searchService.search(q, lat, lng, user);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<SearchResult>>> autocomplete(
            @RequestParam String q,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        List<SearchResult> results = searchService.autocomplete(q, lat, lng);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/reverse")
    public ResponseEntity<ApiResponse<SearchResult>> reverseGeocode(
            @RequestParam double lat,
            @RequestParam double lng) {

        SearchResult result = searchService.reverseGeocode(lat, lng);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
