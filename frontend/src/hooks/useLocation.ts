import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates, LocationState } from '../types';

export interface UseLocationOptions {
  highAccuracy?: boolean;
  accuracyThresholdMeters?: number;
  movementThresholdMeters?: number;
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    highAccuracy = true,
    accuracyThresholdMeters = 150,
    movementThresholdMeters = 2.0,
  } = options;

  const [state, setState] = useState<LocationState>({
    coords: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
    isTracking: false,
    isLocating: false,
    isFollowing: false,
    permissionState: 'prompt',
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<Coordinates | null>(null);
  const isFollowingRef = useRef<boolean>(false);

  // Monitor permission state where supported
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(permissionStatus => {
          setState(s => ({
            ...s,
            permissionState: permissionStatus.state as 'prompt' | 'granted' | 'denied',
          }));

          permissionStatus.onchange = () => {
            setState(s => ({
              ...s,
              permissionState: permissionStatus.state as 'prompt' | 'granted' | 'denied',
            }));
          };
        })
        .catch(() => {
          // Permissions API query not supported for geolocation in some browsers
        });
    }
  }, []);

  // Calculate bearing between two GPS points when hardware compass is unavailable
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return (toDeg(θ) + 360) % 360;
  };

  // Haversine distance in meters
  const calculateDistanceMeters = (c1: Coordinates, c2: Coordinates): number => {
    const R = 6371000;
    const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.latitude * Math.PI) / 180) *
        Math.cos((c2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const processPosition = useCallback(
    (pos: GeolocationPosition, onUpdate?: (coords: Coordinates) => void) => {
      const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
      let rawHeading = pos.coords.heading;

      // Filter out low-accuracy jitter if a good fix already exists
      if (
        accuracy > accuracyThresholdMeters &&
        lastCoordsRef.current !== null &&
        (state.accuracy ?? 999) < accuracyThresholdMeters
      ) {
        return;
      }

      const newCoords: Coordinates = { latitude, longitude };

      // Calculate bearing from movement if device heading is not provided
      if ((rawHeading === null || isNaN(rawHeading)) && lastCoordsRef.current) {
        const dist = calculateDistanceMeters(lastCoordsRef.current, newCoords);
        if (dist >= movementThresholdMeters) {
          rawHeading = calculateBearing(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            latitude,
            longitude
          );
        } else {
          rawHeading = state.heading; // retain prior heading
        }
      }

      lastCoordsRef.current = newCoords;

      setState(s => ({
        ...s,
        coords: newCoords,
        latitude,
        longitude,
        accuracy,
        altitude,
        heading: rawHeading,
        speed: speed ?? (s.speed ?? 0),
        timestamp: pos.timestamp,
        permissionState: 'granted',
        isLocating: false,
        error: null,
      }));

      if (onUpdate) {
        onUpdate(newCoords);
      }
    },
    [accuracyThresholdMeters, movementThresholdMeters, state.accuracy, state.heading]
  );

  const getCurrentLocation = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err = 'Geolocation is not supported by your browser';
        setState(s => ({ ...s, error: err, permissionState: 'unavailable', isLocating: false }));
        reject(new Error(err));
        return;
      }

      setState(s => ({ ...s, isLocating: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          processPosition(position);
          resolve(coords);
        },
        error => {
          let msg = 'Failed to retrieve location';
          let permState: LocationState['permissionState'] = 'unavailable';

          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied by user. Please enable GPS access in your browser settings.';
            permState = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'GPS location is temporarily unavailable. Check your device location settings.';
            permState = 'unavailable';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
            permState = 'timeout';
          }

          setState(s => ({
            ...s,
            error: msg,
            permissionState: permState,
            isLocating: false,
          }));
          reject(new Error(msg));
        },
        { enableHighAccuracy: highAccuracy, timeout: 12000, maximumAge: 0 }
      );
    });
  }, [highAccuracy, processPosition]);

  const startWatching = useCallback(
    (onUpdate?: (coords: Coordinates) => void) => {
      if (!('geolocation' in navigator)) return;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      setState(s => ({ ...s, isTracking: true, error: null }));

      watchIdRef.current = navigator.geolocation.watchPosition(
        position => {
          processPosition(position, onUpdate);
        },
        error => {
          let msg = 'GPS tracking lost';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied';
          }
          setState(s => ({ ...s, error: msg, isTracking: false }));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 15000,
          maximumAge: 1000,
        }
      );
    },
    [highAccuracy, processPosition]
  );

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState(s => ({ ...s, isTracking: false, isFollowing: false }));
    isFollowingRef.current = false;
  }, []);

  const setFollowing = useCallback((following: boolean) => {
    isFollowingRef.current = following;
    setState(s => ({ ...s, isFollowing: following }));
  }, []);

  const toggleFollowUser = useCallback(() => {
    const next = !isFollowingRef.current;
    setFollowing(next);
  }, [setFollowing]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    setFollowing,
    toggleFollowUser,
  };
}
