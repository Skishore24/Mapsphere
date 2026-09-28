import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { SearchBox } from './components/SearchBox';
import { DirectionsPanel } from './components/DirectionsPanel';
import { PlaceDetailsModal } from './components/PlaceDetailsModal';
import { FavoritesDrawer } from './components/FavoritesDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { LiveShareModal } from './components/LiveShareModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { useLocation } from './hooks/useLocation';
import { useWebSocket } from './hooks/useWebSocket';
import { mapService } from './services/mapService';
import { routeService } from './services/routeService';
import { favoriteService } from './services/favoriteService';
import { locationService } from './services/locationService';
import { Place, SearchResult, RouteResponse, Coordinates, LocationMessage } from './types';

function MapSphereApp() {
  const { coords: userCoords, getCurrentLocation, startWatching, stopWatching } = useLocation();

  // Panels & Modals State
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
  const [trackingShareId, setTrackingShareId] = useState<string | null>(null);
  const [liveTrackedLocation, setLiveTrackedLocation] = useState<LocationMessage | null>(null);

  // Check URL query for tracking link: ?track={shareId}
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (trackId) {
      setTrackingShareId(trackId);
      locationService.getTrackingSession(trackId).then(session => {
        if (session.latitude && session.longitude) {
          setLiveTrackedLocation({
            shareId: trackId,
            latitude: session.latitude,
            longitude: session.longitude,
            accuracy: session.accuracy,
            heading: session.heading,
            speed: session.speed,
            timestamp: session.lastUpdate || new Date().toISOString(),
          });
        }
      }).catch(err => console.warn('Could not load tracking link', err));
    }
  }, []);

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
    } catch (err) {
      console.error('Failed to calculate route', err);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // User click on Search Result
  const handleSelectSearchResult = (result: SearchResult) => {
    const p: Place = {
      id: result.placeId || Date.now(),
      name: result.name,
      description: result.displayName,
      category: result.category || 'LOCATION',
      address: result.displayName,
      latitude: result.latitude,
      longitude: result.longitude,
      rating: 4.5,
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

  // Save Favorite
  const handleSaveFavorite = async (placeId: number, customName?: string, tag?: string) => {
    await favoriteService.addFavorite(placeId, customName, tag);
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
    getCurrentLocation().catch(err => alert(err.message));
  };

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

      {/* Floating Search Box */}
      <SearchBox
        onSelectResult={handleSelectSearchResult}
        userCoords={userCoords}
      />

      {/* Interactive Map */}
      <MapView
        places={places}
        userCoords={userCoords}
        selectedPlace={selectedPlace}
        onSelectPlace={p => setSelectedPlace(p)}
        route={route}
        liveTrackedLocation={liveTrackedLocation}
        onViewportChange={handleViewportChange}
        onMapClick={handleMapClick}
        onLocateUser={handleLocateUser}
        activeCategory={selectedCategory}
      />

      {/* Directions Panel */}
      {activePanel === 'directions' && (
        <DirectionsPanel
          onClose={() => { setActivePanel(null); setRoute(null); }}
          onCalculateRoute={handleCalculateRoute}
          route={route}
          isLoading={isRoutingLoading}
          userCoords={userCoords}
          initialOrigin={directionsOrigin}
          initialDestination={directionsDest}
        />
      )}

      {/* Place Details Modal / Card */}
      {selectedPlace && (
        <PlaceDetailsModal
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
            // Trigger search with query
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
          }}
          onStopBroadcasting={() => {
            setIsBroadcasting(false);
            setActiveShareId(null);
            stopWatching();
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
    <AuthProvider>
      <MapSphereApp />
    </AuthProvider>
  );
}
