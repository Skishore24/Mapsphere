import React, { useEffect, useState } from 'react';
import { RouteHistoryItem, SearchHistoryItem } from '../types';
import { historyService } from '../services/historyService';
import { History, X, Search, Navigation, Trash2, Clock, Loader2, Car, Footprints, Bike } from 'lucide-react';

interface HistoryDrawerProps {
  onClose: () => void;
  onSelectSearch: (query: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  onClose,
  onSelectSearch,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'routes'>('search');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (tab: 'search' | 'routes') => {
    setActiveTab(tab);
    setIsLoading(true);
  };

  useEffect(() => {
    let isCancelled = false;
    const fetchHistory = async () => {
      try {
        if (activeTab === 'search') {
          const data = await historyService.getSearchHistory();
          if (!isCancelled) {
            setSearchHistory(data);
            setIsLoading(false);
          }
        } else {
          const data = await historyService.getRouteHistory();
          if (!isCancelled) {
            setRouteHistory(data);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Failed to load history', err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  const handleClear = async () => {
    try {
      if (activeTab === 'search') {
        await historyService.clearSearchHistory();
        setSearchHistory([]);
      } else {
        await historyService.clearRouteHistory();
        setRouteHistory([]);
      }
    } catch (err) {
      console.error('Failed to clear history', err);
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
      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Activity History</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '8px 12px 0',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '8px',
      }}>
        <button
          onClick={() => handleTabChange('search')}
          style={{
            flex: 1,
            padding: '8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'search' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'search' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Recent Searches
        </button>
        <button
          onClick={() => handleTabChange('routes')}
          style={{
            flex: 1,
            padding: '8px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'routes' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'routes' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Route History
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : activeTab === 'search' ? (
          searchHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>No Searches Recorded</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {searchHistory.map(item => (
                <div
                  key={item.id}
                  onClick={() => { onSelectSearch(item.query); onClose(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{item.query}</span>
                  </div>
                  <Clock size={12} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )
        ) : (
          routeHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              <Navigation size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>No Routes Recorded</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {routeHistory.map(item => (
                <div key={item.id} style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                      {item.travelMode === 'WALKING' ? <Footprints size={14} /> : item.travelMode === 'CYCLING' ? <Bike size={14} /> : <Car size={14} />}
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{item.travelMode}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {(item.distanceMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    {item.originName} → {item.destinationName}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer Clear */}
      {((activeTab === 'search' && searchHistory.length > 0) || (activeTab === 'routes' && routeHistory.length > 0)) && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-rose)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        </div>
      )}
    </div>
  );
};
