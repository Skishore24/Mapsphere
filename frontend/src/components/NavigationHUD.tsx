import React from 'react';
import { NavigationState } from '../types';
import { 
  ArrowUp, 
  CornerUpLeft, 
  CornerUpRight, 
  RotateCcw, 
  Flag, 
  X, 
  Compass, 
  AlertTriangle,
  RotateCw
} from 'lucide-react';

interface NavigationHUDProps {
  navState: NavigationState;
  onStopNavigation: () => void;
  onRecenter: () => void;
  isFollowing?: boolean;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  navState,
  onStopNavigation,
  onRecenter,
  isFollowing = true,
}) => {
  const { currentStep, distanceToNextManeuver, remainingDistanceMeters, remainingDurationSeconds, etaString, status } = navState;

  // Render Maneuver Direction Icon
  const renderManeuverIcon = () => {
    if (!currentStep) return <ArrowUp size={36} />;

    const type = currentStep.maneuverType?.toUpperCase() || 'CONTINUE';
    const mod = currentStep.modifier?.toUpperCase() || '';

    if (type === 'ARRIVE') return <Flag size={36} color="#10b981" />;
    if (mod.includes('UTURN')) return <RotateCcw size={36} />;
    if (mod.includes('LEFT') || type === 'TURN_LEFT') return <CornerUpLeft size={36} />;
    if (mod.includes('RIGHT') || type === 'TURN_RIGHT') return <CornerUpRight size={36} />;
    if (type === 'ROUNDABOUT') return <RotateCw size={36} />;

    return <ArrowUp size={36} />;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `${hrs} hr ${rem} min`;
    }
    return `${mins} min`;
  };

  const isRerouting = status === 'REROUTING' || status === 'OFF_ROUTE';
  const isArrived = status === 'ARRIVED';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 1001,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '16px',
    }}>
      {/* Top Maneuver Banner */}
      <div style={{
        pointerEvents: 'auto',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: isRerouting 
          ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
          : isArrived 
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'linear-gradient(135deg, #1e293b, #0f172a)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'slideInTop 0.25s ease-out',
      }}>
        {/* Maneuver Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isRerouting ? <AlertTriangle size={32} /> : renderManeuverIcon()}
        </div>

        {/* Maneuver Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isRerouting ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Off Route
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Recalculating Route...</div>
            </div>
          ) : isArrived ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Arrived
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>You have reached your destination!</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.1 }}>
                {formatDistance(distanceToNextManeuver)}
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
                marginTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentStep?.instruction || 'Follow road'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Control Bar */}
      <div style={{
        pointerEvents: 'auto',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideInBottom 0.25s ease-out',
      }}>
        {/* Trip Stats */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {formatDuration(remainingDurationSeconds)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({formatDistance(remainingDistanceMeters)})
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
            ETA {etaString || '--:--'}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Re-center GPS Button */}
          <button
            onClick={onRecenter}
            title="Center Location"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isFollowing ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isFollowing ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)'}`,
              color: isFollowing ? '#60a5fa' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={18} />
          </button>

          {/* End Navigation Button */}
          <button
            onClick={onStopNavigation}
            title="End Navigation"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: 'var(--accent-rose)',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={16} />
            <span>End</span>
          </button>
        </div>
      </div>
    </div>
  );
};
