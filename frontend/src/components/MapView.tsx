import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, RouteResponse, Coordinates, LocationMessage } from '../types';
import { Locate } from 'lucide-react';

function getCategorySymbol(cat: string): string {
  switch (cat.toUpperCase()) {
    case 'RESTAURANT': return '🍴';
    case 'HOSPITAL': return '🏥';
    case 'HOTEL': return '🏨';
    case 'COLLEGE': case 'SCHOOL': return '🎓';
    case 'PARK': return '🌳';
    case 'PETROL_STATION': return '⛽';
    case 'BANK': case 'ATM': return '🏦';
    case 'PHARMACY': return '💊';
    case 'SHOP': return '🛍️';
    default: return '📍';
  }
}

interface MapViewProps {
  places: Place[];
  userCoords: Coordinates | null;
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  route: RouteResponse | null;
  liveTrackedLocation: LocationMessage | null;
  onViewportChange: (minLat: number, minLng: number, maxLat: number, maxLng: number) => void;
  onMapClick: (coords: Coordinates) => void;
  onLocateUser: () => void;
  activeCategory: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  userCoords,
  selectedPlace,
  onSelectPlace,
  route,
  liveTrackedLocation,
  onViewportChange,
  onMapClick,
  onLocateUser,
  activeCategory,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const liveTrackedMarkerRef = useRef<L.Marker | null>(null);

  const onViewportChangeRef = useRef(onViewportChange);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onMapClickRef.current = onMapClick;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center Pollachi / Coimbatore
    const initialCenter: [number, number] = [10.658, 77.008];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    // CartoDB Voyager Tile Layer (Modern, clean, ultra-readable)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom Controls top right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Places Layer
    const placesLayer = L.layerGroup().addTo(map);
    placesLayerRef.current = placesLayer;

    // Viewport change listener (Bounding Box)
    map.on('moveend', () => {
      const bounds = map.getBounds();
      onViewportChangeRef.current(
        bounds.getSouth(),
        bounds.getWest(),
        bounds.getNorth(),
        bounds.getEast()
      );
    });

    // Map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });

    mapRef.current = map;

    // Initial bounding box load
    const b = map.getBounds();
    onViewportChangeRef.current(b.getSouth(), b.getWest(), b.getNorth(), b.getEast());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Places Markers
  useEffect(() => {
    if (!mapRef.current || !placesLayerRef.current) return;

    placesLayerRef.current.clearLayers();

    const filteredPlaces = activeCategory
      ? places.filter(p => p.category.toUpperCase() === activeCategory.toUpperCase())
      : places;

    filteredPlaces.forEach(place => {
      const catClass = `cat-${place.category.toLowerCase()}`;
      const iconHtml = `<div class="category-pin ${catClass}">
        <span style="font-size: 14px; font-weight: 800;">${getCategorySymbol(place.category)}</span>
      </div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      marker.addTo(placesLayerRef.current!);
    });
  }, [places, activeCategory, onSelectPlace]);

  // Update User Location Marker
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

    const latlng: [number, number] = [userCoords.latitude, userCoords.longitude];

    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        html: '<div class="user-location-marker"></div>',
        className: 'user-pin-wrapper',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      userMarkerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }
  }, [userCoords]);

  // Update Live Tracked Session Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (liveTrackedLocation) {
      const latlng: [number, number] = [liveTrackedLocation.latitude, liveTrackedLocation.longitude];

      if (!liveTrackedMarkerRef.current) {
        const icon = L.divIcon({
          html: '<div class="live-tracked-marker"></div>',
          className: 'live-pin-wrapper',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        liveTrackedMarkerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current);
        mapRef.current.panTo(latlng);
      } else {
        liveTrackedMarkerRef.current.setLatLng(latlng);
      }
    } else if (liveTrackedMarkerRef.current) {
      liveTrackedMarkerRef.current.remove();
      liveTrackedMarkerRef.current = null;
    }
  }, [liveTrackedLocation]);

  // Update Routing Polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (route && route.geometry && route.geometry.length > 0) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      // Draw high-visibility modern gradient-style route
      const polyline = L.polyline(route.geometry as [number, number][], {
        color: '#6366f1',
        weight: 6,
        opacity: 0.9,
        lineJoin: 'round',
      }).addTo(mapRef.current);

      routePolylineRef.current = polyline;
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    } else if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
  }, [route]);

  // Focus Selected Place
  useEffect(() => {
    if (mapRef.current && selectedPlace) {
      mapRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, { duration: 1.2 });
    }
  }, [selectedPlace]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Map Action Controls */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '16px',
        zIndex: 990,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Locate User Button */}
        <button
          onClick={onLocateUser}
          title="Find My Location"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-subtle)',
            color: userCoords ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Locate size={20} />
        </button>
      </div>
    </div>
  );
};
