import { apiFetch } from './api';
import { Place } from '../types';

export const mapService = {
  async getAllPlaces(): Promise<Place[]> {
    return apiFetch<Place[]>('/api/v1/places');
  },

  async getNearbyPlaces(lat: number, lng: number, radiusMeters: number = 5000): Promise<Place[]> {
    return apiFetch<Place[]>(`/api/v1/places/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
  },

  async getPlacesInBoundingBox(minLat: number, minLng: number, maxLat: number, maxLng: number): Promise<Place[]> {
    return apiFetch<Place[]>(`/api/v1/places/bbox?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`);
  },

  async getPlaceById(id: number): Promise<Place> {
    return apiFetch<Place>(`/api/v1/places/${id}`);
  },
};
