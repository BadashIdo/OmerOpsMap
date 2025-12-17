import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, MapPin, Building2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchBar({ sites, streets, onSiteSelect, onOpenChat }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({ sites: [], streets: [] });
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ sites: [], streets: [] });
      return;
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    const matchedSites = sites
      .filter(site => 
        site.name?.toLowerCase().includes(normalizedQuery) ||
        site.address?.toLowerCase().includes(normalizedQuery) ||
        site.description?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 8);

    const matchedStreets = streets
      .filter(street =>
        street.name?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 3);

    setResults({ sites: matchedSites, streets: matchedStreets });
  }, [query, sites, streets]);

  const handleSelect = (item, type) => {
    if (type === 'site') {
      onSiteSelect(item);
    }
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = results.sites.length > 0 || results.streets.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="חיפוש רחוב, מוסד או אתר..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-10 pl-20 h-12 text-base bg-white/95 backdrop-blur-sm border-slate-200 rounded-xl shadow-lg"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600"
            onClick={onOpenChat}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 max-h-80 overflow-y-auto">
          {!hasResults ? (
            <div className="p-4 text-center text-slate-500">
              <p>לא נמצאו תוצאות</p>
              <Button
                variant="link"
                className="mt-1"
                onClick={onOpenChat}
              >
                שאל את OmerBot
              </Button>
            </div>
          ) : (
            <>
              {results.streets.length > 0 && (
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-500 px-2 mb-1">רחובות</p>
                  {results.streets.map(street => (
                    <button
                      key={street.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-right"
                      onClick={() => handleSelect(street, 'street')}
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{street.name}</p>
                        <p className="text-xs text-slate-500">
                          רובע {street.district} • {street.neighborhood}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.sites.length > 0 && (
                <div className="p-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 px-2 mb-1">אתרים</p>
                  {results.sites.map(site => (
                    <button
                      key={site.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-right"
                      onClick={() => handleSelect(site, 'site')}
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{site.name}</p>
                        <p className="text-xs text-slate-500">{site.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}


            </>
          )}
        </div>
      )}
    </div>
  );
}