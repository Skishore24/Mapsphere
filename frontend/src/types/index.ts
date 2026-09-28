export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface Place {
  id: number;
  name: string;
  description?: string;
  category: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
}

export interface SearchResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  category?: string;
  type: string;
  placeId?: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  modifier?: string;
}

export interface RouteResponse {
  distanceMeters: number;
  durationSeconds: number;
  travelMode: string;
  geometry: [number, number][]; // [lat, lng]
  steps: RouteStep[];
  summary: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FavoriteItem {
  id: number;
  customName: string;
  tag: string;
  place: Place;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: number;
  query: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface RouteHistoryItem {
  id: number;
  originName: string;
  destinationName: string;
  distanceMeters: number;
  durationSeconds: number;
  travelMode: string;
  createdAt: string;
}

export interface LocationMessage {
  shareId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export interface ShareSession {
  shareId: string;
  expiresAt: string;
  trackingUrl: string;
}
