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
  openingHours?: string;
  rating?: number;
}

export interface SearchResult {
  id?: string;
  name: string;
  displayName: string;
  address?: string;
  latitude: number;
  longitude: number;
  category?: string;
  type: string; // DATABASE_PLACE, ADDRESS, CITY, STREET, POI
  distance?: number;
  importance?: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  source?: string;
  placeId?: number;
}

export interface RouteStep {
  instruction: string;
  maneuverType?: string; // DEPART, ARRIVE, TURN, CONTINUE, MERGE, ROUNDABOUT, FORK, ON_RAMP, OFF_RAMP, U_TURN, NEW_NAME
  modifier?: string;     // LEFT, RIGHT, SLIGHT_LEFT, SLIGHT_RIGHT, SHARP_LEFT, SHARP_RIGHT, STRAIGHT, UTURN
  roadName?: string;
  distanceMeters: number;
  durationSeconds: number;
  startCoordinate?: [number, number];
  endCoordinate?: [number, number];
}

export interface RouteResponse {
  distanceMeters: number;
  durationSeconds: number;
  travelMode: string;
  geometry: [number, number][]; // [lat, lng]
  steps: RouteStep[];
  summary: string;
  alternatives?: RouteResponse[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
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
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
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

export interface LocationState {
  coords: Coordinates | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  isTracking: boolean;
  isLocating: boolean;
  isFollowing: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout';
  error: string | null;
}

export type NavigationStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'ROUTING'
  | 'NAVIGATING'
  | 'OFF_ROUTE'
  | 'REROUTING'
  | 'ARRIVED'
  | 'ERROR';

export interface NavigationState {
  status: NavigationStatus;
  currentStepIndex: number;
  currentStep: RouteStep | null;
  distanceToNextManeuver: number;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  etaString: string;
  offRouteCount: number;
}
