package com.mapsphere.service.routing;

import com.mapsphere.dto.route.RouteRequest;
import com.mapsphere.dto.route.RouteResponse;

public interface RoutingProvider {
    RouteResponse calculateRoute(RouteRequest request);
}
