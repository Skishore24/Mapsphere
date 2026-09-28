import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  Navigation, 
  Radio, 
  Bookmark, 
  History, 
  ShieldAlert, 
  User as UserIcon, 
  LogOut, 
  Search,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenDirections: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onOpenLiveShare: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string | null;
  activePanel: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDirections,
  onOpenFavorites,
  onOpenHistory,
  onOpenLiveShare,
  onOpenAuth,
  onOpenAdmin,
  onSelectCategory,
  selectedCategory,
  activePanel,
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const categories = [
    { label: 'All', value: '' },
    { label: 'Restaurants', value: 'RESTAURANT' },
    { label: 'Hospitals', value: 'HOSPITAL' },
    { label: 'Hotels', value: 'HOTEL' },
    { label: 'Colleges', value: 'COLLEGE' },
    { label: 'Parks', value: 'PARK' },
    { label: 'Gas / EV', value: 'PETROL_STATION' },
  ];

  return (
    <header className="glass-panel" style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 18px',
      gap: '16px',
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => onSelectCategory('')}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.45)',
        }}>
          <Compass size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>MapSphere</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}>GIS</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>Real-time Spatial</span>
        </div>
      </div>

      {/* Category Pills (Desktop Scroll) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        maxWidth: '520px',
        padding: '2px 4px',
      }}>
        {categories.map(cat => {
          const isActive = selectedCategory === cat.value || (!selectedCategory && cat.value === '');
          return (
            <button
              key={cat.label}
              onClick={() => onSelectCategory(cat.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Directions Trigger */}
        <button
          onClick={onOpenDirections}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: activePanel === 'directions' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            border: '1px solid ' + (activePanel === 'directions' ? 'var(--accent-primary)' : 'var(--border-subtle)'),
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Navigation size={16} />
          <span>Directions</span>
        </button>

        {/* Live Location Sharing Trigger */}
        <button
          onClick={onOpenLiveShare}
          title="Share Live Location"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-emerald)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          <Radio size={16} />
          <span>Live Share</span>
        </button>

        {/* Favorites Trigger */}
        <button
          onClick={onOpenFavorites}
          title="Saved Places"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: activePanel === 'favorites' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: activePanel === 'favorites' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <Bookmark size={18} />
        </button>

        {/* History Trigger */}
        <button
          onClick={onOpenHistory}
          title="Search & Route History"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: activePanel === 'history' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: activePanel === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          <History size={18} />
        </button>

        {/* Admin Dashboard */}
        {isAuthenticated && (
          <button
            onClick={onOpenAdmin}
            title="Admin Dashboard"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--accent-purple)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              cursor: 'pointer',
            }}
          >
            <ShieldAlert size={18} />
          </button>
        )}

        {/* Auth / Profile */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              <UserIcon size={14} color="var(--accent-cyan)" />
              <span>{user.name.split(' ')[0]}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              padding: '8px 16px',
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
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
