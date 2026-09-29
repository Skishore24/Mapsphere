import React, { useState, useEffect, useRef } from 'react';
import { searchService } from '../services/searchService';
import { SearchResult } from '../types';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface SearchBoxProps {
  onSelectResult: (result: SearchResult) => void;
  onSetAsOrigin?: (result: SearchResult) => void;
  onSetAsDestination?: (result: SearchResult) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  externalQuery?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSelectResult,
  userCoords,
  externalQuery,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalQuery && externalQuery !== query) {
      setQuery(externalQuery);
    }
  }, [externalQuery, query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchService.search(query, userCoords?.latitude, userCoords?.longitude);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, userCoords]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelectResult(item);
  };

  return (
    <div ref={containerRef} style={{
      position: 'absolute',
      top: '84px',
      left: '16px',
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      zIndex: 999,
    }}>
      <div className="glass-panel" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        gap: '10px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <Search size={18} color="var(--accent-cyan)" />
        <input
          type="text"
          placeholder="Search places, addresses, cafes..."
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
          }}
        />
        {isLoading && <Loader2 size={16} color="var(--text-muted)" className="animate-spin" />}
        {query && !isLoading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="glass-modal" style={{
          marginTop: '8px',
          maxHeight: '340px',
          overflowY: 'auto',
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {results.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: item.type === 'DATABASE_PLACE' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MapPin size={16} color={item.type === 'DATABASE_PLACE' ? 'var(--accent-primary)' : 'var(--accent-cyan)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  {item.category && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}>
                      {item.category}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}>
                  {item.displayName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
