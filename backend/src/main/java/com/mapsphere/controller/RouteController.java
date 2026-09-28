package com.mapsphere.controller;

import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.entity.User;
import com.mapsphere.repository.UserRepository;
import com.mapsphere.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;
    private final UserRepository userRepository;

    public RouteController(RouteService routeService, UserRepository userRepository) {
        this.routeService = routeService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<RouteResponse> calculateRoute(
            @Valid @RequestBody RouteRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }

        return ResponseEntity.ok(routeService.calculateRoute(request, user));
    }
}
