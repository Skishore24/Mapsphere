import React, { useEffect, useState } from 'react';
import { FavoriteItem, Place } from '../types';
import { favoriteService } from '../services/favoriteService';
import { Bookmark, X, Trash2, MapPin, Navigation, Loader2 } from 'lucide-react';

interface FavoritesDrawerProps {
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onDirectionsTo: (place: Place) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  onClose,
  onSelectPlace,
  onDirectionsTo,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    favoriteService.getFavorites()
      .then(data => {
        if (!isCancelled) {
          setFavorites(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load favorites', err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRemove = async (placeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await favoriteService.removeFavorite(placeId);
      setFavorites(favs => favs.filter(f => f.place.id !== placeId));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  return (
    <div className="glass-modal" style={{
      position: 'absolute',
      top: '84px',
      right: '16px',
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 110px)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bookmark size={18} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Saved Places</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '12px', overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
            <Bookmark size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>No Saved Places Yet</div>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Click any place on the map to save it to your favorites.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {favorites.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectPlace(item.place)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MapPin size={16} color="var(--accent-amber)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.customName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.place.address}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDirectionsTo(item.place); }}
                    title="Directions"
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Navigation size={15} />
                  </button>
                  <button
                    onClick={(e) => handleRemove(item.place.id, e)}
                    title="Remove"
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
