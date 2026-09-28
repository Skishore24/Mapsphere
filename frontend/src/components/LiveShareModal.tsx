import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { locationService } from '../services/locationService';
import { ShareSession, Coordinates } from '../types';
import { Radio, X, Copy, Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LiveShareModalProps {
  onClose: () => void;
  userCoords: Coordinates | null;
  onStartBroadcasting: (shareId: string) => void;
  onStopBroadcasting: () => void;
  isBroadcasting: boolean;
  currentShareId: string | null;
}

export const LiveShareModal: React.FC<LiveShareModalProps> = ({
  onClose,
  userCoords,
  onStartBroadcasting,
  onStopBroadcasting,
  isBroadcasting,
  currentShareId,
}) => {
  const { isAuthenticated } = useAuth();
  const [session, setSession] = useState<ShareSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartShare = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await locationService.startShare();
      setSession(data);
      onStartBroadcasting(data.shareId);
    } catch (err: any) {
      setError(err.message || 'Failed to start live session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopShare = async () => {
    const idToStop = session?.shareId || currentShareId;
    if (idToStop) {
      try {
        await locationService.stopShare(idToStop);
      } catch (err) {
        console.error('Error stopping share', err);
      }
    }
    setSession(null);
    onStopBroadcasting();
  };

  const shareLink = (session?.shareId || currentShareId) 
    ? `${window.location.origin}/?track=${session?.shareId || currentShareId}`
    : '';

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div className="glass-modal" style={{
        width: '420px',
        maxWidth: '100%',
        padding: '24px',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-emerald)',
          }}>
            <Radio size={22} className={isBroadcasting ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Live Location Sharing</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time GPS Broadcast via WebSocket</span>
          </div>
        </div>

        {!isAuthenticated ? (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--accent-rose)',
            fontSize: '13px',
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>Please sign in to start a private live location sharing link.</span>
          </div>
        ) : isBroadcasting || session ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--accent-emerald)',
                boxShadow: '0 0 10px var(--accent-emerald)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  Broadcasting Live Location
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Anyone with the link can follow your movements on their map.
                </div>
              </div>
            </div>

            {/* Link Box */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Shareable Link (Expires in 2 hours)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
              }}>
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: copied ? 'var(--accent-emerald)' : '#fff',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {userCoords && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                GPS: {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
              </div>
            )}

            <button
              onClick={handleStopShare}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.2)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Stop Broadcasting
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generate a temporary, secure live location link. Viewers see your position update in real-time as you move.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              <ShieldCheck size={16} color="var(--accent-cyan)" />
              <span>Temporary random ID • Session automatically expires after 2h</span>
            </div>

            {error && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '12px' }}>{error}</div>
            )}

            <button
              onClick={handleStartShare}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
              <span>{isLoading ? 'Creating Session...' : 'Start Live Broadcast'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
