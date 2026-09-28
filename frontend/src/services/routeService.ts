import { apiFetch } from './api';
import { RouteResponse, Coordinates } from '../types';

export const routeService = {
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'DRIVING' | 'WALKING' | 'CYCLING' = 'DRIVING',
    originName?: string,
    destinationName?: string
  ): Promise<RouteResponse> {
    return apiFetch<RouteResponse>('/api/v1/routes', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination,
        mode,
        originName,
        destinationName,
      }),
    });
  },
};
