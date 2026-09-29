import { useState, useRef, useCallback } from 'react';
import { Coordinates, RouteResponse, NavigationState } from '../types';
import { routeService } from '../services/routeService';

export function useNavigation() {
  const [navState, setNavState] = useState<NavigationState>({
    status: 'IDLE',
    currentStepIndex: 0,
    currentStep: null,
    distanceToNextManeuver: 0,
    remainingDistanceMeters: 0,
    remainingDurationSeconds: 0,
    etaString: '',
    offRouteCount: 0,
  });

  const [activeRoute, setActiveRoute] = useState<RouteResponse | null>(null);
  const destinationRef = useRef<Coordinates | null>(null);
  const travelModeRef = useRef<'DRIVING' | 'WALKING' | 'CYCLING'>('DRIVING');
  const lastRerouteTimeRef = useRef<number>(0);
  const offRouteCounterRef = useRef<number>(0);

  // Compute point to line segment minimum distance in meters
  const pointToSegmentDistanceMeters = (
    pLat: number, pLng: number,
    aLat: number, aLng: number,
    bLat: number, bLng: number
  ): number => {
    // Equirectangular approximation for small distances
    const toRad = Math.PI / 180;
    const R = 6371000;
    const x = (pLng - aLng) * toRad * Math.cos(((aLat + pLat) / 2) * toRad);
    const y = (pLat - aLat) * toRad;
    const dx = (bLng - aLng) * toRad * Math.cos(((aLat + bLat) / 2) * toRad);
    const dy = (bLat - aLat) * toRad;

    const segmentLenSq = dx * dx + dy * dy;
    if (segmentLenSq === 0) {
      return Math.sqrt(x * x + y * y) * R;
    }

    const t = Math.max(0, Math.min(1, (x * dx + y * dy) / segmentLenSq));
    const projX = aLng * toRad * Math.cos(((aLat + pLat) / 2) * toRad) + t * dx;
    const projY = aLat * toRad + t * dy;

    const finalDx = (pLng * toRad * Math.cos(((aLat + pLat) / 2) * toRad)) - projX;
    const finalDy = (pLat * toRad) - projY;
    return Math.sqrt(finalDx * finalDx + finalDy * finalDy) * R;
  };

  // Find minimum distance from user point to route polyline
  const distanceToPolyline = (point: Coordinates, geometry: [number, number][]): number => {
    if (!geometry || geometry.length < 2) return 0;
    let minDistance = Infinity;

    for (let i = 0; i < geometry.length - 1; i++) {
      const [lat1, lng1] = geometry[i];
      const [lat2, lng2] = geometry[i + 1];
      const d = pointToSegmentDistanceMeters(point.latitude, point.longitude, lat1, lng1, lat2, lng2);
      if (d < minDistance) {
        minDistance = d;
      }
    }
    return minDistance;
  };

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

  const formatEta = (secondsRemaining: number): string => {
    const etaDate = new Date(Date.now() + secondsRemaining * 1000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startNavigation = useCallback((
    route: RouteResponse,
    destination: Coordinates,
    mode: 'DRIVING' | 'WALKING' | 'CYCLING' = 'DRIVING'
  ) => {
    setActiveRoute(route);
    destinationRef.current = destination;
    travelModeRef.current = mode;
    lastRerouteTimeRef.current = 0;
    offRouteCounterRef.current = 0;

    const firstStep = route.steps && route.steps.length > 0 ? route.steps[0] : null;

    setNavState({
      status: 'NAVIGATING',
      currentStepIndex: 0,
      currentStep: firstStep,
      distanceToNextManeuver: firstStep ? firstStep.distanceMeters : 0,
      remainingDistanceMeters: route.distanceMeters,
      remainingDurationSeconds: route.durationSeconds,
      etaString: formatEta(route.durationSeconds),
      offRouteCount: 0,
    });
  }, []);

  const stopNavigation = useCallback(() => {
    setActiveRoute(null);
    destinationRef.current = null;
    offRouteCounterRef.current = 0;

    setNavState({
      status: 'IDLE',
      currentStepIndex: 0,
      currentStep: null,
      distanceToNextManeuver: 0,
      remainingDistanceMeters: 0,
      remainingDurationSeconds: 0,
      etaString: '',
      offRouteCount: 0,
    });
  }, []);

  // Continuous GPS updates during navigation
  const updateNavProgress = useCallback(async (userCoords: Coordinates) => {
    if (navState.status !== 'NAVIGATING' && navState.status !== 'OFF_ROUTE') {
      return;
    }

    if (!activeRoute || !destinationRef.current) {
      return;
    }

    // 1. Check for Arrival (within 25 meters of destination)
    const distToDestination = calculateDistanceMeters(userCoords, destinationRef.current);
    if (distToDestination <= 25) {
      setNavState(s => ({
        ...s,
        status: 'ARRIVED',
        remainingDistanceMeters: 0,
        remainingDurationSeconds: 0,
        distanceToNextManeuver: 0,
      }));
      return;
    }

    // 2. Check distance from route polyline
    const distToRoute = distanceToPolyline(userCoords, activeRoute.geometry);
    const OFF_ROUTE_THRESHOLD_METERS = 40.0;

    if (distToRoute > OFF_ROUTE_THRESHOLD_METERS) {
      offRouteCounterRef.current += 1;

      // If off route for at least 3 consecutive fixes (> 4 sec)
      if (offRouteCounterRef.current >= 3) {
        const now = SystemCurrentTime();
        // Cooldown: at least 10 seconds between automatic reroutes
        if (now - lastRerouteTimeRef.current > 10000) {
          lastRerouteTimeRef.current = now;
          setNavState(s => ({ ...s, status: 'REROUTING' }));

          try {
            const newRoute = await routeService.calculateRoute(
              userCoords,
              destinationRef.current,
              travelModeRef.current
            );

            setActiveRoute(newRoute);
            offRouteCounterRef.current = 0;

            const firstStep = newRoute.steps && newRoute.steps.length > 0 ? newRoute.steps[0] : null;

            setNavState({
              status: 'NAVIGATING',
              currentStepIndex: 0,
              currentStep: firstStep,
              distanceToNextManeuver: firstStep ? firstStep.distanceMeters : 0,
              remainingDistanceMeters: newRoute.distanceMeters,
              remainingDurationSeconds: newRoute.durationSeconds,
              etaString: formatEta(newRoute.durationSeconds),
              offRouteCount: 0,
            });
            return;
          } catch (err) {
            console.warn('Rerouting calculation failed:', err);
            setNavState(s => ({ ...s, status: 'OFF_ROUTE' }));
          }
        } else {
          setNavState(s => ({ ...s, status: 'OFF_ROUTE' }));
        }
      }
    } else {
      // User is on route
      offRouteCounterRef.current = 0;
      if (navState.status === 'OFF_ROUTE') {
        setNavState(s => ({ ...s, status: 'NAVIGATING' }));
      }
    }

    // 3. Step Progression: Find which step we are currently executing
    let stepIndex = navState.currentStepIndex;
    const steps = activeRoute.steps;

    if (steps && steps.length > 0) {
      // Advance step if closer than 20 meters to next step start
      if (stepIndex + 1 < steps.length) {
        const nextStep = steps[stepIndex + 1];
        if (nextStep.startCoordinate) {
          const distToNextStep = calculateDistanceMeters(userCoords, {
            latitude: nextStep.startCoordinate[0],
            longitude: nextStep.startCoordinate[1],
          });

          if (distToNextStep < 20) {
            stepIndex += 1;
          }
        }
      }

      const currentStep = steps[stepIndex];
      let distToManeuver = currentStep.distanceMeters;

      if (currentStep.startCoordinate) {
        distToManeuver = Math.round(calculateDistanceMeters(userCoords, {
          latitude: currentStep.startCoordinate[0],
          longitude: currentStep.startCoordinate[1],
        }));
      }

      // Compute approximate remaining distance to destination
      const remainingDist = Math.max(0, Math.round(distToDestination));
      const speedMs = travelModeRef.current === 'WALKING' ? 1.4 : (travelModeRef.current === 'CYCLING' ? 4.2 : 11.0);
      const remainingDur = Math.max(0, Math.round(remainingDist / speedMs));

      setNavState(s => ({
        ...s,
        currentStepIndex: stepIndex,
        currentStep,
        distanceToNextManeuver: distToManeuver,
        remainingDistanceMeters: remainingDist,
        remainingDurationSeconds: remainingDur,
        etaString: formatEta(remainingDur),
      }));
    }
  }, [activeRoute, navState.currentStepIndex, navState.status]);

  return {
    navState,
    activeRoute,
    startNavigation,
    stopNavigation,
    updateNavProgress,
  };
}

function SystemCurrentTime(): number {
  return Date.now();
}
