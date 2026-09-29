import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useToast } from './context/useToast';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { SearchBox } from './components/SearchBox';
import { DirectionsPanel } from './components/DirectionsPanel';
import { NavigationHUD } from './components/NavigationHUD';
import { PlaceDetailsModal } from './components/PlaceDetailsModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { LiveShareModal } from './components/LiveShareModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { useLocation } from './hooks/useLocation';
import { useNavigation } from './hooks/useNavigation';
import { useWebSocket } from './hooks/useWebSocket';
import { mapService } from './services/mapService';
import { routeService } from './services/routeService';
import { favoriteService } from './services/favoriteService';
import { locationService } from './services/locationService';
import { Place, SearchResult, RouteResponse, Coordinates, LocationMessage } from './types';

function MapSphereApp() {
  const toast = useToast();
  const { coords: userCoords, getCurrentLocation, startWatching, stopWatching } = useLocation();
  const { navState, activeRoute, startNavigation, stopNavigation, updateNavProgress } = useNavigation();

  // Panels & Modals State
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map Data State
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Routing Origin / Destination pre-fills
  const [directionsOrigin, setDirectionsOrigin] = useState<{ coords: Coordinates; name: string } | null>(null);
  const [directionsDest, setDirectionsDest] = useState<{ coords: Coordinates; name: string } | null>(null);

  // Live Location Sharing State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [trackingShareId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('track');
  });
  const [liveTrackedLocation, setLiveTrackedLocation] = useState<LocationMessage | null>(null);

  // Check URL query for tracking link: ?track={shareId}
  useEffect(() => {
    if (trackingShareId) {
      locationService.getTrackingSession(trackingShareId).then(session => {
        if (session.latitude && session.longitude) {
          setLiveTrackedLocation({
            shareId: trackingShareId,
            latitude: session.latitude,
            longitude: session.longitude,
            accuracy: session.accuracy,
            heading: session.heading,
            speed: session.speed,
            timestamp: session.lastUpdate || new Date().toISOString(),
          });
          toast.info(`Connecting to live tracking session...`);
        }
      }).catch(err => {
        console.warn('Could not load tracking link', err);
        toast.error('Unable to join live tracking session');
      });
    }
  }, [trackingShareId, toast]);

  // WebSocket for Live Tracking & Broadcasting
  const handleLocationReceived = useCallback((msg: LocationMessage) => {
    setLiveTrackedLocation(msg);
  }, []);

  const { sendLocationUpdate } = useWebSocket(trackingShareId || activeShareId, handleLocationReceived);

  // Broadcast GPS updates when sharing is active
  useEffect(() => {
    if (isBroadcasting && activeShareId && userCoords) {
      sendLocationUpdate({
        shareId: activeShareId,
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isBroadcasting, activeShareId, userCoords, sendLocationUpdate]);

  // Continuously update turn-by-turn navigation progress during active trips
  useEffect(() => {
    if (userCoords && (navState.status === 'NAVIGATING' || navState.status === 'OFF_ROUTE')) {
      updateNavProgress(userCoords);
    }
  }, [userCoords, navState.status, updateNavProgress]);

  // Viewport Bounding Box places loading
  const handleViewportChange = useCallback(async (minLat: number, minLng: number, maxLat: number, maxLng: number) => {
    try {
      const data = await mapService.getPlacesInBoundingBox(minLat, minLng, maxLat, maxLng);
      setPlaces(data);
    } catch (err) {
      console.error('Failed to load places in bounding box', err);
    }
  }, []);

  // Calculate Route
  const handleCalculateRoute = async (
    origin: Coordinates,
    dest: Coordinates,
    mode: 'DRIVING' | 'WALKING' | 'CYCLING',
    originName?: string,
    destName?: string
  ) => {
    setIsRoutingLoading(true);
    try {
      const res = await routeService.calculateRoute(origin, dest, mode, originName, destName);
      setRoute(res);
      toast.success(`Optimal route calculated (${(res.distanceMeters / 1000).toFixed(1)} km, ${Math.round(res.durationSeconds / 60)} min)`);
    } catch (err: any) {
      console.error('Failed to calculate route', err);
      toast.error('Routing service unavailable. Please check endpoints.');
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // User click on Search Result
  const handleSelectSearchResult = (result: SearchResult) => {
    const isDbPlace = typeof result.placeId === 'number' && result.placeId > 0;
    const computedId = isDbPlace 
      ? result.placeId! 
      : -1 * Math.abs(Math.floor(result.latitude * 10000 + result.longitude * 10000)) || -1;

    const p: Place = {
      id: computedId,
      name: result.name,
      description: result.displayName,
      category: result.category || 'LOCATION',
      address: result.displayName,
      latitude: result.latitude,
      longitude: result.longitude,
      rating: isDbPlace ? 4.5 : undefined,
    };
    setSelectedPlace(p);
  };

  // "Directions Here" quick action from Place Modal or Drawer
  const handleDirectionsTo = (place: Place) => {
    setDirectionsDest({
      coords: { latitude: place.latitude, longitude: place.longitude },
      name: place.name,
    });
    if (userCoords) {
      setDirectionsOrigin({
        coords: userCoords,
        name: 'My Current Location',
      });
      handleCalculateRoute(userCoords, { latitude: place.latitude, longitude: place.longitude }, 'DRIVING', 'My Current Location', place.name);
    }
    setActivePanel('directions');
    setSelectedPlace(null);
  };

  // Start Turn-by-Turn Navigation HUD
  const handleStartNavigation = (r: RouteResponse, dest: Coordinates, mode: 'DRIVING' | 'WALKING' | 'CYCLING') => {
    startNavigation(r, dest, mode);
    setActivePanel(null);
    setSelectedPlace(null);
    toast.info(`Navigation started (${r.steps?.length || 0} maneuvers)`);
  };

  // Save Favorite
  const handleSaveFavorite = async (placeId: number, customName?: string, tag?: string) => {
    try {
      await favoriteService.addFavorite(placeId, customName, tag);
      toast.success('Place saved to your favorites');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save favorite place');
    }
  };

  // Map Click
  const handleMapClick = (coords: Coordinates) => {
    // If directions open and needs destination, set it
    if (activePanel === 'directions') {
      setDirectionsDest({
        coords,
        name: `Selected Point (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
      });
    }
  };

  // Locate User Button
  const handleLocateUser = () => {
    getCurrentLocation()
      .then(pos => {
        toast.info(`GPS location acquired (accuracy: ±${Math.round(pos.accuracy || 10)}m)`);
      })
      .catch(err => {
        toast.error(err.message || 'Location access is disabled. Please enable device permissions.');
      });
  };

  const isNavigating = navState.status !== 'IDLE';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <Navbar
        onOpenDirections={() => setActivePanel(p => p === 'directions' ? null : 'directions')}
        onOpenFavorites={() => setActivePanel(p => p === 'favorites' ? null : 'favorites')}
        onOpenHistory={() => setActivePanel(p => p === 'history' ? null : 'history')}
        onOpenLiveShare={() => setActivePanel('liveshare')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectCategory={cat => setSelectedCategory(cat || null)}
        selectedCategory={selectedCategory}
        activePanel={activePanel}
      />

      {/* Floating Search Box (hidden during active turn-by-turn HUD to keep map clear) */}
      {!isNavigating && (
        <SearchBox
          onSelectResult={handleSelectSearchResult}
          userCoords={userCoords}
          externalQuery={searchQuery}
        />
      )}

      {/* Turn-by-Turn Navigation HUD Overlay */}
      {isNavigating && (
        <NavigationHUD
          navState={navState}
          onStopNavigation={stopNavigation}
          onRecenter={handleLocateUser}
        />
      )}

      {/* Interactive Map */}
      <MapView
        places={places}
        userCoords={userCoords}
        selectedPlace={selectedPlace}
        onSelectPlace={p => setSelectedPlace(p)}
        route={activeRoute || route}
        liveTrackedLocation={liveTrackedLocation}
        onViewportChange={handleViewportChange}
        onMapClick={handleMapClick}
        onLocateUser={handleLocateUser}
        activeCategory={selectedCategory}
      />

      {/* Directions Panel */}
      {activePanel === 'directions' && !isNavigating && (
        <DirectionsPanel
          onClose={() => { setActivePanel(null); setRoute(null); }}
          onCalculateRoute={handleCalculateRoute}
          onStartNavigation={handleStartNavigation}
          route={route}
          isLoading={isRoutingLoading}
          userCoords={userCoords}
          initialOrigin={directionsOrigin}
          initialDestination={directionsDest}
        />
      )}

      {/* Place Details Modal / Card */}
      {selectedPlace && !isNavigating && (
        <PlaceDetailsModal
          key={selectedPlace.id}
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDirectionsTo={handleDirectionsTo}
          onSaveFavorite={handleSaveFavorite}
        />
      )}

      {/* Favorites Drawer */}
      {activePanel === 'favorites' && (
        <FavoritesDrawer
          onClose={() => setActivePanel(null)}
          onSelectPlace={p => setSelectedPlace(p)}
          onDirectionsTo={handleDirectionsTo}
        />
      )}

      {/* History Drawer */}
      {activePanel === 'history' && (
        <HistoryDrawer
          onClose={() => setActivePanel(null)}
          onSelectSearch={q => {
            setSearchQuery(q);
            setActivePanel(null);
          }}
        />
      )}

      {/* Live Location Share Modal */}
      {activePanel === 'liveshare' && (
        <LiveShareModal
          onClose={() => setActivePanel(null)}
          userCoords={userCoords}
          onStartBroadcasting={shareId => {
            setActiveShareId(shareId);
            setIsBroadcasting(true);
            startWatching();
            toast.success('Live location broadcasting started');
          }}
          onStopBroadcasting={() => {
            setIsBroadcasting(false);
            setActiveShareId(null);
            stopWatching();
            toast.info('Live location sharing ended');
          }}
          isBroadcasting={isBroadcasting}
          currentShareId={activeShareId}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Admin Telemetry Modal */}
      {isAdminOpen && (
        <AdminDashboardModal
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MapSphereApp />
      </AuthProvider>
    </ToastProvider>
  );
}
