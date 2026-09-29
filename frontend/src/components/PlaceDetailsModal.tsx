import React, { useState } from 'react';
import { Place } from '../types';
import { useAuth } from '../context/useAuth';
import { 
  X, 
  MapPin, 
  Navigation, 
  Bookmark, 
  Phone, 
  Globe, 
  Star, 
  Check 
} from 'lucide-react';

interface PlaceDetailsModalProps {
  place: Place | null;
  onClose: () => void;
  onDirectionsTo: (place: Place) => void;
  onSaveFavorite: (placeId: number, customName?: string, tag?: string) => Promise<void>;
  isSaved?: boolean;
}

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({
  place,
  onClose,
  onDirectionsTo,
  onSaveFavorite,
  isSaved = false,
}) => {
  const { isAuthenticated } = useAuth();
  const selectedTag = 'FAVORITE';
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const isSavedActive = isSaved || justSaved;

  if (!place) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveFavorite(place.id, place.name, selectedTag);
      setJustSaved(true);
    } catch (err) {
      console.error('Failed to save place', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-modal place-details-modal">
      {/* Mobile bottom sheet drag handle */}
      <div className="bottom-sheet-drag-handle" />

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <span style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            marginBottom: '6px',
          }}>
            {place.category}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{place.name}</h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Rating & Distance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '12px 0' }}>
        {place.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={16} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{place.rating.toFixed(1)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <MapPin size={14} color="var(--accent-cyan)" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {place.address || 'Location Coordinates'}
          </span>
        </div>
      </div>

      {/* Description */}
      {place.description && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
          {place.description}
        </p>
      )}

      {/* Phone & Website Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
          >
            <Phone size={14} />
            <span>{place.phone}</span>
          </a>
        )}
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}
          >
            <Globe size={14} />
            <span>Visit Website</span>
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={() => onDirectionsTo(place)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
          }}
        >
          <Navigation size={16} />
          <span>Directions</span>
        </button>

        <button
          onClick={handleSave}
          disabled={!isAuthenticated || isSaving || isSavedActive || place.id <= 0}
          title={!isAuthenticated ? 'Sign in to save places' : place.id <= 0 ? 'Custom search locations cannot be bookmarked' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px',
            borderRadius: 'var(--radius-md)',
            background: isSavedActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            color: isSavedActive ? 'var(--accent-emerald)' : '#fff',
            border: '1px solid ' + (isSavedActive ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'),
            fontWeight: 600,
            fontSize: '13px',
            cursor: !isAuthenticated || isSavedActive ? 'default' : 'pointer',
            opacity: !isAuthenticated ? 0.6 : 1,
          }}
        >
          {isSavedActive ? (
            <>
              <Check size={16} />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark size={16} />
              <span>Save Place</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
