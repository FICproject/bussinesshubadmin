import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Briefcase, GitPullRequest, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults(null);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [query]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    setIsOpen(true);
    try {
      const data = await apiFetch(`/api/admin/dashboard/global-search?q=${encodeURIComponent(searchTerm)}`);
      setResults(data);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults =
    results &&
    (results.members?.length > 0 || results.services?.length > 0 || results.requests?.length > 0);

  return (
    <div ref={dropdownRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          value={query}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global lookup: search across members, services, or inquiries..."
          className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              setIsOpen(false);
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Results Box */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto p-3 text-xs">
          {loading ? (
            <p className="p-4 text-center text-slate-400 animate-pulse">Searching FIC ecosystem records...</p>
          ) : !hasResults ? (
            <p className="p-4 text-center text-slate-400">No matching records found for "{query}".</p>
          ) : (
            <div className="space-y-3">
              {/* Members Category */}
              {results.members?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Members ({results.members.length})
                  </span>
                  <div className="space-y-1">
                    {results.members.map((m: any) => (
                      <div
                        key={m._id}
                        onClick={() => handleSelect('/members')}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-3.5 h-3.5 text-sky-500" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</p>
                            <p className="text-[10px] text-slate-400">{m.email} • {m.primaryCategoryName}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Category */}
              {results.services?.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Marketplace Services ({results.services.length})
                  </span>
                  <div className="space-y-1">
                    {results.services.map((s: any) => (
                      <div
                        key={s._id}
                        onClick={() => handleSelect('/services')}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</p>
                            <p className="text-[10px] text-slate-400">{s.categoryName}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requests Category */}
              {results.requests?.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Intermediary Requests ({results.requests.length})
                  </span>
                  <div className="space-y-1">
                    {results.requests.map((r: any) => (
                      <div
                        key={r._id}
                        onClick={() => handleSelect('/requests')}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <GitPullRequest className="w-3.5 h-3.5 text-emerald-500" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{r.title}</p>
                            <p className="text-[10px] text-slate-400">By: {r.requesterName} • {r.status}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

