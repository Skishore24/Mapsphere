import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { ShieldAlert, X, Users, MapPin, Navigation, Radio, Activity, Loader2 } from 'lucide-react';

interface AdminDashboardModalProps {
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>('/api/v1/admin/stats')
      .then(d => setStats(d))
      .catch(e => console.error('Failed to load admin stats', e))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div className="glass-modal" style={{
        width: '500px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)',
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>MapSphere Admin Telemetry</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spatial Infrastructure & Analytics</span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Database & System Health</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {stats.systemStatus}
              </span>
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  <Users size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Total Users</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{stats.totalUsers}</div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                  <MapPin size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Spatial Places</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{stats.totalPlaces}</div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', marginBottom: '8px' }}>
                  <Navigation size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Calculated Routes</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{stats.totalCalculatedRoutes}</div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                  <Radio size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Live Tracking Sessions</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{stats.activeLiveSessions}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--accent-rose)', fontSize: '13px' }}>Failed to load stats. Ensure you are signed in as an ADMIN.</div>
        )}
      </div>
    </div>
  );
};
