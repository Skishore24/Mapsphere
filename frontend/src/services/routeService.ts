import { apiFetch } from './api';
import { RouteResponse, Coordinates } from '../types';

export interface RouteOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
}

export const routeService = {
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'DRIVING' | 'WALKING' | 'CYCLING' = 'DRIVING',
    originName?: string,
    destinationName?: string,
    options: RouteOptions = {}
  ): Promise<RouteResponse> {
    return apiFetch<RouteResponse>('/api/v1/routes', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination,
        mode,
        originName,
        destinationName,
        avoidTolls: options.avoidTolls || false,
        avoidHighways: options.avoidHighways || false,
        avoidFerries: options.avoidFerries || false,
      }),
    });
  },
};
