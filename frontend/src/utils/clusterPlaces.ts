import L from 'leaflet';
import { Place } from '../types';

export interface ClusteredItem {
  isCluster: boolean;
  count: number;
  latitude: number;
  longitude: number;
  place: Place;
  places: Place[];
  bounds: L.LatLngBounds;
}

/**
 * Fast spatial grid clustering for Leaflet map views.
 * High-performance, viewport-aware clustering without heavy external libraries.
 */
export function clusterPlaces(places: Place[], zoom: number, map: L.Map): ClusteredItem[] {
  if (!places || places.length === 0) return [];

  // No clustering needed at street zoom level
  if (zoom >= 14) {
    return places.map(p => ({
      isCluster: false,
      count: 1,
      latitude: p.latitude,
      longitude: p.longitude,
      place: p,
      places: [p],
      bounds: L.latLngBounds([[p.latitude, p.longitude], [p.latitude, p.longitude]]),
    }));
  }

  // Grid cluster radius in pixels
  const clusterRadiusPixels = zoom < 11 ? 70 : (zoom < 13 ? 55 : 45);
  const clusters: {
    point: L.Point;
    places: Place[];
    latSum: number;
    lngSum: number;
  }[] = [];

  for (const place of places) {
    const latLng = L.latLng(place.latitude, place.longitude);
    const point = map.latLngToLayerPoint(latLng);

    let matchedCluster: (typeof clusters)[0] | null = null;
    for (const cluster of clusters) {
      const dist = point.distanceTo(cluster.point);
      if (dist <= clusterRadiusPixels) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.places.push(place);
      matchedCluster.latSum += place.latitude;
      matchedCluster.lngSum += place.longitude;
      // Re-center cluster centroid
      const count = matchedCluster.places.length;
      const centerLatLng = L.latLng(matchedCluster.latSum / count, matchedCluster.lngSum / count);
      matchedCluster.point = map.latLngToLayerPoint(centerLatLng);
    } else {
      clusters.push({
        point,
        places: [place],
        latSum: place.latitude,
        lngSum: place.longitude,
      });
    }
  }

  return clusters.map(c => {
    const isCluster = c.places.length > 1;
    const centerLat = c.latSum / c.places.length;
    const centerLng = c.lngSum / c.places.length;

    const bounds = L.latLngBounds(c.places.map(p => [p.latitude, p.longitude]));

    return {
      isCluster,
      count: c.places.length,
      latitude: centerLat,
      longitude: centerLng,
      place: c.places[0],
      places: c.places,
      bounds,
    };
  });
}
