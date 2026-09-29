import L from 'leaflet';

/**
 * MapSphere Production Vector Marker System
 * High-definition, SVG-rendered pins without emojis.
 */

// Curated Category Colors and SVG Icons
interface CategoryMeta {
  color: string;
  bgColor: string;
  svgIcon: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  RESTAURANT: {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v8a2 2 0 0 1-2 2h-1V2"/><path d="M11 2v8a2 2 0 0 1-2 2H8V2"/><path d="M14 12v10"/><path d="M8 12v10"/></svg>`,
  },
  HOSPITAL: {
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>`,
  },
  HOTEL: {
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><circle cx="6" cy="8" r="2"/></svg>`,
  },
  COLLEGE: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  },
  SCHOOL: {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  },
  PARK: {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 11l7-7 7 7"/><path d="M8 17l4-4 4 4"/></svg>`,
  },
  PETROL_STATION: {
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M14 13h4a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h0"/><circle cx="7" cy="7" r="1.5"/></svg>`,
  },
  BANK: {
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v4"/><path d="M12 14v4"/><path d="M16 14v4"/></svg>`,
  },
  PHARMACY: {
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  },
  SHOP: {
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  },
  LOCATION: {
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    svgIcon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>`,
  },
};

export function getCategoryMeta(category: string): CategoryMeta {
  const upper = category ? category.toUpperCase().trim() : 'LOCATION';
  return CATEGORY_MAP[upper] || CATEGORY_MAP.LOCATION;
}

/**
 * Creates a modern MapSphere Vector POI Pin
 */
export function createCategoryIcon(category: string, isSelected: boolean = false): L.DivIcon {
  const meta = getCategoryMeta(category);
  const size = isSelected ? 42 : 34;
  const iconSize = isSelected ? 18 : 15;

  const html = `
    <div class="mapsphere-poi-pin ${isSelected ? 'selected' : ''}" style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 4px;
      transform: rotate(-45deg);
      background: ${isSelected ? '#ffffff' : meta.color};
      color: ${isSelected ? meta.color : '#ffffff'};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35)${isSelected ? `, 0 0 0 4px ${meta.color}66` : ''};
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        ${meta.svgIcon.replace('width="16"', `width="${iconSize}"`).replace('height="16"', `height="${iconSize}"`)}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'mapsphere-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

/**
 * Creates a Cluster Marker with count badge
 */
export function createClusterIcon(count: number): L.DivIcon {
  let size = 36;
  let bg = 'rgba(99, 102, 241, 0.85)';
  let border = 'rgba(165, 180, 252, 0.5)';

  if (count >= 20) {
    size = 44;
    bg = 'rgba(147, 51, 234, 0.85)';
    border = 'rgba(216, 180, 254, 0.5)';
  } else if (count >= 10) {
    size = 40;
    bg = 'rgba(6, 182, 212, 0.85)';
    border = 'rgba(165, 243, 252, 0.5)';
  }

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bg};
      backdrop-filter: blur(8px);
      border: 2px solid ${border};
      color: #ffffff;
      font-weight: 800;
      font-size: ${size > 40 ? 14 : 12}px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      cursor: pointer;
      transition: transform 0.15s ease;
    ">
      ${count}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'mapsphere-cluster-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Creates user location indicator with optional heading cone
 */
export function createUserLocationIcon(heading: number | null = null): L.DivIcon {
  const hasHeading = heading !== null && !isNaN(heading);
  const size = 36;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${hasHeading ? `
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 24px solid rgba(59, 130, 246, 0.4);
          transform-origin: 50% 100%;
          transform: translateY(-16px) rotate(${heading}deg);
        "></div>
      ` : ''}
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.6), 0 0 0 2px rgba(59, 130, 246, 0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'mapsphere-user-location-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Creates live-tracked friend / session location pin
 */
export function createLiveTrackedIcon(): L.DivIcon {
  const size = 32;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.25);
        animation: pulseRing 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      "></div>
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #10b981;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 10px rgba(16, 185, 129, 0.6);
        z-index: 2;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'mapsphere-live-session-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
