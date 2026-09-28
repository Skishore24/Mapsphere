package com.mapsphere.service.routing;

import com.mapsphere.dto.route.Coordinates;
import com.mapsphere.dto.route.RouteResponse;

public interface RoutingProvider {
    RouteResponse calculateRoute(Coordinates origin, Coordinates destination, String mode);
}
