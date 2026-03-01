'use client';

// ============================================
// Journal Search Component - Premium Dark Theme
// ============================================

import { useState, useEffect } from 'react';
import { EMOTIONS, Emotion } from '@/lib/journal';
import { cn } from '@/lib/utils';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';

interface JournalSearchProps {
  searchQuery: string;
  emotionFilter: Emotion | null;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (query: string) => void;
  onEmotionChange: (emotion: Emotion | null) => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onSearch: () => void;
  className?: string;
}

export default function JournalSearch({
  searchQuery,
  emotionFilter,
  sortOrder,
  onSearchChange,
  onEmotionChange,
  onSortOrderChange,
  onSearch,
  className,
}: JournalSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
        onSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchChange(localSearch);
      onSearch();
    }
  };

  const activeFilterCount = (emotionFilter ? 1 : 0);

  return (
    <div className={cn('space-y-4 relative z-20', className)}>
      {/* Search Bar Row */}
      <div className="flex gap-2.5">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-light group-focus-within:text-rose-400 transition-colors" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search your journal entries..."
            className={cn(
              'w-full h-12 pl-11 pr-10 rounded-full',
              'bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_4px_20px_rgba(152,112,112,0.06)]',
              'text-sm text-coffee-dark placeholder:text-coffee-light/70',
              'focus:outline-none focus:border-rose-200 focus:bg-white/80 focus:shadow-[0_8px_30px_rgba(219,181,181,0.2)]',
              'transition-all duration-300'
            )}
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
                onSearch();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-rose-50 text-coffee-light hover:text-rose-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 h-12 rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(152,112,112,0.06)]',
            showFilters || activeFilterCount > 0
              ? 'border-transparent bg-gradient-to-r from-rose-100 to-blush-100 text-rose-700 shadow-[0_4px_12px_rgba(219,181,181,0.3)]'
              : 'border border-white/80 bg-white/60 backdrop-blur-md text-coffee-light hover:border-rose-100 hover:text-coffee hover:bg-white/80 hover:shadow-[0_8px_25px_rgba(152,112,112,0.1)]'
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline font-medium text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-rose-400 text-white text-[10px] shadow-sm ml-1 font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Toggle Button */}
        <button
          onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
          className={cn(
            'flex items-center gap-2 px-4 h-12 rounded-full',
            'border border-white/80 bg-white/60 backdrop-blur-md text-coffee-light',
            'hover:border-rose-100 hover:text-coffee hover:bg-white/80',
            'transition-all duration-300 shadow-[0_4px_20px_rgba(152,112,112,0.06)]'
          )}
          title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline font-medium text-sm">
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute w-full z-30 mt-2 glass-card p-5 animate-scale-in origin-top-right">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-coffee-dark tracking-wide">Filter by Emotion</h3>
            {emotionFilter && (
              <button
                onClick={() => {
                  onEmotionChange(null);
                  onSearch();
                }}
                className="text-xs font-medium text-rose-400 hover:text-rose-600 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => {
                  onEmotionChange(
                    emotionFilter === emotion.value ? null : emotion.value
                  );
                  onSearch();
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                  'transition-all duration-300 border',
                  emotionFilter === emotion.value
                    ? 'bg-gradient-to-r from-rose-100 to-blush-100 border-white text-rose-700 shadow-[0_4px_12px_rgba(219,181,181,0.3)] scale-[0.98]'
                    : 'bg-white/50 border-white/60 text-coffee-light hover:border-white hover:bg-white/80 hover:text-coffee hover:shadow-sm hover:-translate-y-0.5'
                )}
              >
                <span className="drop-shadow-sm text-lg">{emotion.emoji}</span>
                <span className="tracking-wide">{emotion.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
