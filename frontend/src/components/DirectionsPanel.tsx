import React, { useState } from 'react';
import { RouteResponse, Coordinates } from '../types';
import { 
  Navigation, 
  Car, 
  Footprints, 
  Bike, 
  ArrowUpDown, 
  X, 
  Clock, 
  Milestone, 
  MapPin, 
  LocateFixed,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DirectionsPanelProps {
  onClose: () => void;
  onCalculateRoute: (origin: Coordinates, dest: Coordinates, mode: 'DRIVING' | 'WALKING' | 'CYCLING', originName?: string, destName?: string) => Promise<void>;
  route: RouteResponse | null;
  isLoading: boolean;
  userCoords?: Coordinates | null;
  initialOrigin?: { coords: Coordinates; name: string } | null;
  initialDestination?: { coords: Coordinates; name: string } | null;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  onClose,
  onCalculateRoute,
  route,
  isLoading,
  userCoords,
  initialOrigin,
  initialDestination,
}) => {
  const [mode, setMode] = useState<'DRIVING' | 'WALKING' | 'CYCLING'>('DRIVING');
  const [originName, setOriginName] = useState(initialOrigin?.name || (userCoords ? 'My Current Location' : ''));
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(initialOrigin?.coords || userCoords || null);

  const [destName, setDestName] = useState(initialDestination?.name || '');
  const [destCoords, setDestCoords] = useState<Coordinates | null>(initialDestination?.coords || null);

  const [showSteps, setShowSteps] = useState(true);

  const handleUseCurrentLocation = () => {
    if (userCoords) {
      setOriginCoords(userCoords);
      setOriginName('My Current Location');
    }
  };

  const handleSwap = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destName);
    setOriginCoords(destCoords);
    setDestName(tempName);
    setDestCoords(tempCoords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (originCoords && destCoords) {
      onCalculateRoute(originCoords, destCoords, mode, originName, destName);
    }
  };

  return (
    <div className="glass-modal" style={{
      position: 'absolute',
      top: '84px',
      left: '16px',
      width: '400px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 110px)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideInLeft 0.25s ease-out',
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
          <Navigation size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Directions & Route</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {/* Mode Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
        }}>
          {(['DRIVING', 'WALKING', 'CYCLING'] as const).map(m => {
            const isActive = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (originCoords && destCoords) {
                    onCalculateRoute(originCoords, destCoords, m, originName, destName);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {m === 'DRIVING' && <Car size={16} />}
                {m === 'WALKING' && <Footprints size={16} />}
                {m === 'CYCLING' && <Bike size={16} />}
                <span>{m === 'DRIVING' ? 'Drive' : m === 'WALKING' ? 'Walk' : 'Cycle'}</span>
              </button>
            );
          })}
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Origin */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Starting location or click map"
                value={originName}
                onChange={e => setOriginName(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              {userCoords && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  title="Use My Current Location"
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                >
                  <LocateFixed size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Origin and Destination"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>

          {/* Destination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
          }}>
            <MapPin size={14} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Destination place or address"
              value={destName}
              onChange={e => setDestName(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !originCoords || !destCoords}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isLoading || !originCoords || !destCoords ? 'not-allowed' : 'pointer',
              opacity: isLoading || !originCoords || !destCoords ? 0.6 : 1,
              marginTop: '4px',
            }}
          >
            {isLoading ? 'Calculating Optimal Route...' : 'Get Directions'}
          </button>
        </form>

        {/* Route Details Card */}
        {route && (
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                    {Math.round(route.durationSeconds / 60)} min
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Milestone size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {(route.distanceMeters / 1000).toFixed(1)} km
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Fastest route based on current conditions
              </div>
            </div>

            {/* Turn-by-Turn Steps Accordion */}
            {route.steps && route.steps.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowSteps(!showSteps)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <span>Step-by-Step Directions ({route.steps.length})</span>
                  {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showSteps && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}>
                    {route.steps.map((step, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '12px',
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{step.instruction}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                            {step.distanceMeters > 1000 
                              ? `${(step.distanceMeters / 1000).toFixed(1)} km` 
                              : `${Math.round(step.distanceMeters)} m`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
