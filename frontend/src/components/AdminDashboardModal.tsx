import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/useAuth';
import { ShieldAlert, X, Users, MapPin, Navigation, Radio, Activity, Loader2, KeyRound, HardDrive } from 'lucide-react';

interface AdminDashboardModalProps {
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = () => {
    setIsLoading(true);
    setErrorMsg(null);
    apiFetch<any>('/api/v1/admin/stats')
      .then(d => {
        setStats(d);
        setErrorMsg(null);
      })
      .catch(e => {
        console.warn('Failed to load admin stats', e);
        setStats(null);
        setErrorMsg(e.message || 'Access restricted. Please sign in as an Administrator.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickAdminLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      await login('admin@mapsphere.com', 'Admin@12345');
      fetchStats();
    } catch (err: any) {
      setErrorMsg('Failed to sign in as admin: ' + (err.message || 'Check database connection'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <div className="glass-modal" style={{
        width: '540px',
        maxWidth: '100%',
        padding: '28px',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(99, 102, 241, 0.3))',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)',
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>MapSphere Admin Telemetry</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Spatial Infrastructure & System Analytics</span>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-muted)', gap: '12px' }}>
            <Loader2 size={32} className="animate-spin" color="var(--accent-purple)" />
            <span style={{ fontSize: '13px' }}>Loading system telemetry...</span>
          </div>
        ) : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>PostgreSQL & PostGIS Cluster</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)' }}>
                {stats.systemStatus || 'ONLINE'}
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

            {/* Memory stats */}
            {stats.memoryUsedMb && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={15} color="var(--text-muted)" />
                  <span>JVM Heap Memory</span>
                </div>
                <span style={{ fontWeight: 700, color: '#fff' }}>
                  {stats.memoryUsedMb} MB / {stats.memoryTotalMb} MB
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <KeyRound size={22} color="var(--accent-rose)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  Admin Authorization Required
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Telemetry and system metrics require an Administrator account (`ROLE_ADMIN`).
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickAdminLogin}
              disabled={isLoggingIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
              <span>Sign In as Demo Admin (admin@mapsphere.com)</span>
            </button>

            {errorMsg && (
              <span style={{ fontSize: '11px', color: 'var(--accent-rose)', textAlign: 'center' }}>
                {errorMsg}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
