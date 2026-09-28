package com.mapsphere.controller;

import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;
import com.mapsphere.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping
    public ResponseEntity<RouteResponse> calculateRoute(
            @Valid @RequestBody RouteRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(routeService.calculateRoute(request, email));
    }
}
