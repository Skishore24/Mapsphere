import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates } from '../types';

export interface LocationState {
  coords: Coordinates | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  isLocating: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
    isLocating: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const getCurrentLocation = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err = 'Geolocation is not supported by your browser';
        setState(s => ({ ...s, error: err }));
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
          setState({
            coords,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            error: null,
            isLocating: false,
          });
          resolve(coords);
        },
        error => {
          let msg = 'Failed to retrieve location';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied by user';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out';
          }
          setState(s => ({ ...s, error: msg, isLocating: false }));
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const startWatching = useCallback((onUpdate?: (coords: Coordinates) => void) => {
    if (!('geolocation' in navigator) || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setState({
          coords,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          error: null,
          isLocating: false,
        });
        if (onUpdate) onUpdate(coords);
      },
      error => {
        setState(s => ({ ...s, error: error.message }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

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
  };
}
