import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place, RouteResponse, Coordinates, LocationMessage } from '../types';
import { Locate, Layers, Globe, Map as MapIcon, Mountain, Check } from 'lucide-react';
import { createCategoryIcon, createClusterIcon, createUserLocationIcon, createLiveTrackedIcon } from '../utils/markerIcons';
import { clusterPlaces, ClusteredItem } from '../utils/clusterPlaces';

export type BasemapStyle = 'streets' | 'osm' | 'satellite' | 'topo';

interface BasemapOption {
  id: BasemapStyle;
  name: string;
  badge: string;
  url: string;
  subdomains?: string;
  attribution: string;
  icon: React.ReactNode;
}

const BASEMAPS: BasemapOption[] = [
  {
    id: 'streets',
    name: 'Ultra Fast Streets',
    badge: 'Blazing CDN',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; High-Speed CDN',
    icon: <MapIcon size={14} />,
  },
  {
    id: 'satellite',
    name: 'Satellite Imagery',
    badge: 'High-Res',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    icon: <Globe size={14} />,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    badge: 'Community',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
    icon: <Layers size={14} />,
  },
  {
    id: 'topo',
    name: 'Topographic Terrain',
    badge: 'Contours',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Topo contributors',
    icon: <Mountain size={14} />,
  },
];

interface MapViewProps {
  places: Place[];
  userCoords: Coordinates | null;
  userHeading?: number | null;
  userAccuracy?: number | null;
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  route: RouteResponse | null;
  liveTrackedLocation: LocationMessage | null;
  onViewportChange: (minLat: number, minLng: number, maxLat: number, maxLng: number) => void;
  onMapClick: (coords: Coordinates) => void;
  onLocateUser: () => void;
  activeCategory: string | null;
  isNavigating?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  userCoords,
  userHeading,
  userAccuracy,
  selectedPlace,
  onSelectPlace,
  route,
  liveTrackedLocation,
  onViewportChange,
  onMapClick,
  onLocateUser,
  activeCategory,
  isNavigating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const altRoutePolylinesRef = useRef<L.Polyline[]>([]);
  const liveTrackedMarkerRef = useRef<L.Marker | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<BasemapStyle>('streets');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  const onViewportChangeRef = useRef(onViewportChange);
  const onMapClickRef = useRef(onMapClick);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onMapClickRef.current = onMapClick;
    onSelectPlaceRef.current = onSelectPlace;
  });

  // Switch basemap layer dynamically
  const applyTileLayer = useCallback((style: BasemapStyle, map: L.Map) => {
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }

    const cartoKey = import.meta.env.VITE_CARTO_API_KEY;
    const customTileUrl = import.meta.env.VITE_MAP_TILE_URL;

    let url: string;
    let attribution: string;
    let subdomains: string | undefined;

    if (customTileUrl) {
      url = customTileUrl;
      attribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; Custom Tiles';
      subdomains = 'abc';
    } else if (cartoKey && cartoKey.trim()) {
      url = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey.trim()}`;
      attribution = '&copy; OpenStreetMap &copy; CARTO';
      subdomains = 'abcd';
    } else {
      const option = BASEMAPS.find(b => b.id === style) || BASEMAPS[0];
      url = option.url;
      attribution = option.attribution;
      subdomains = option.subdomains;
    }

    const tileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
      subdomains: subdomains || 'abc',
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: false,
      updateInterval: 100,
    }).addTo(map);

    activeTileLayerRef.current = tileLayer;
  }, []);

  // Update places & clusters when places, zoom, or category changes
  const renderPlacesAndClusters = useCallback(() => {
    if (!mapRef.current || !placesLayerRef.current) return;

    placesLayerRef.current.clearLayers();

    const filtered = activeCategory
      ? places.filter(p => p.category.toUpperCase() === activeCategory.toUpperCase())
      : places;

    const zoom = mapRef.current.getZoom();
    const items: ClusteredItem[] = clusterPlaces(filtered, zoom, mapRef.current);

    items.forEach(item => {
      if (item.isCluster) {
        const clusterIcon = createClusterIcon(item.count);
        const marker = L.marker([item.latitude, item.longitude], { icon: clusterIcon });
        marker.on('click', () => {
          if (mapRef.current) {
            mapRef.current.fitBounds(item.bounds, { padding: [50, 50], maxZoom: 16 });
          }
        });
        marker.addTo(placesLayerRef.current!);
      } else {
        const place = item.place;
        const isSelected = selectedPlace?.id === place.id;
        const icon = createCategoryIcon(place.category, isSelected);
        const marker = L.marker([place.latitude, place.longitude], { icon });
        marker.on('click', () => {
          onSelectPlaceRef.current(place);
        });
        marker.addTo(placesLayerRef.current!);
      }
    });
  }, [places, activeCategory, selectedPlace]);

  const initialBasemapRef = useRef(currentBasemap);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center Pollachi / Coimbatore
    const initialCenter: [number, number] = [10.658, 77.008];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      preferCanvas: true,
    });

    applyTileLayer(initialBasemapRef.current, map);

    // Zoom Controls bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Places Layer
    const placesLayer = L.layerGroup().addTo(map);
    placesLayerRef.current = placesLayer;

    // Viewport change listener with 200ms debounce
    map.on('moveend', () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        onViewportChangeRef.current(
          bounds.getSouth(),
          bounds.getWest(),
          bounds.getNorth(),
          bounds.getEast()
        );
      }, 200);
      renderPlacesAndClusters();
    });

    map.on('zoomend', () => {
      renderPlacesAndClusters();
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
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [applyTileLayer, renderPlacesAndClusters]);

  // Re-render markers when places, category, or selected place change
  useEffect(() => {
    renderPlacesAndClusters();
  }, [renderPlacesAndClusters]);

  // Change basemap style
  const handleSelectBasemap = (style: BasemapStyle) => {
    setCurrentBasemap(style);
    setIsLayerMenuOpen(false);
    if (mapRef.current) {
      applyTileLayer(style, mapRef.current);
    }
  };

  // Update User Location Marker & Accuracy Circle
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

    const latlng: [number, number] = [userCoords.latitude, userCoords.longitude];
    const userIcon = createUserLocationIcon(userHeading ?? null);

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latlng, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(latlng);
      userMarkerRef.current.setIcon(userIcon);
    }

    // Accuracy Circle
    if (userAccuracy && userAccuracy > 5 && userAccuracy < 1000) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle(latlng, {
          radius: userAccuracy,
          color: '#3b82f6',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
        }).addTo(mapRef.current);
      } else {
        userAccuracyCircleRef.current.setLatLng(latlng);
        userAccuracyCircleRef.current.setRadius(userAccuracy);
      }
    } else if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.remove();
      userAccuracyCircleRef.current = null;
    }

    // In Navigation Mode, follow the user smoothly
    if (isNavigating) {
      mapRef.current.panTo(latlng, { animate: true, duration: 0.8 });
    }
  }, [userCoords, userHeading, userAccuracy, isNavigating]);

  // Update Live Tracked Session Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (liveTrackedLocation) {
      const latlng: [number, number] = [liveTrackedLocation.latitude, liveTrackedLocation.longitude];
      const liveIcon = createLiveTrackedIcon();

      if (!liveTrackedMarkerRef.current) {
        liveTrackedMarkerRef.current = L.marker(latlng, { icon: liveIcon, zIndexOffset: 990 }).addTo(mapRef.current);
        mapRef.current.panTo(latlng);
      } else {
        liveTrackedMarkerRef.current.setLatLng(latlng);
      }
    } else if (liveTrackedMarkerRef.current) {
      liveTrackedMarkerRef.current.remove();
      liveTrackedMarkerRef.current = null;
    }
  }, [liveTrackedLocation]);

  // Update Routing Polylines (Primary + Alternatives)
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing route lines
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    altRoutePolylinesRef.current.forEach(p => p.remove());
    altRoutePolylinesRef.current = [];

    if (route && route.geometry && route.geometry.length > 0) {
      // 1. Draw alternative routes (grey/semi-transparent)
      if (route.alternatives && route.alternatives.length > 0) {
        route.alternatives.forEach(alt => {
          if (alt.geometry && alt.geometry.length > 0) {
            const altLine = L.polyline(alt.geometry as [number, number][], {
              color: '#94a3b8',
              weight: 5,
              opacity: 0.6,
              dashArray: '6, 8',
              lineJoin: 'round',
            }).addTo(mapRef.current!);
            altRoutePolylinesRef.current.push(altLine);
          }
        });
      }

      // 2. Draw high-visibility primary route with glowing outline
      const primaryPolyline = L.polyline(route.geometry as [number, number][], {
        color: '#4f46e5',
        weight: 6,
        opacity: 0.95,
        lineJoin: 'round',
      }).addTo(mapRef.current);

      routePolylineRef.current = primaryPolyline;

      if (!isNavigating) {
        mapRef.current.fitBounds(primaryPolyline.getBounds(), { padding: [60, 60] });
      }
    }
  }, [route, isNavigating]);

  // Focus Selected Place
  useEffect(() => {
    if (mapRef.current && selectedPlace) {
      mapRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 16, { duration: 1.2 });
    }
  }, [selectedPlace]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Map Action Controls (hidden in active navigation mode for maximum readability) */}
      {!isNavigating && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '16px',
          zIndex: 990,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {/* Basemap Switcher Menu Popover */}
          {isLayerMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: '105px',
              right: '0',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '210px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.15s ease-out',
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--text-muted)',
                padding: '4px 8px',
              }}>
                Basemap Layer
              </div>

              {BASEMAPS.map(base => {
                const isSelected = currentBasemap === base.id;
                return (
                  <button
                    key={base.id}
                    onClick={() => handleSelectBasemap(base.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {base.icon}
                      </span>
                      <span>{base.name}</span>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-primary)" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Layer Switcher Trigger Button */}
          <button
            onClick={() => setIsLayerMenuOpen(prev => !prev)}
            title="Change Map Style"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: isLayerMenuOpen ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
              backdropFilter: 'blur(16px)',
              border: '1px solid ' + (isLayerMenuOpen ? 'var(--accent-primary)' : 'var(--border-subtle)'),
              color: isLayerMenuOpen ? '#fff' : 'var(--text-secondary)',
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
            <Layers size={20} />
          </button>

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
      )}
    </div>
  );
};
