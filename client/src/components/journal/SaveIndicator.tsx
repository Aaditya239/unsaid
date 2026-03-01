'use client';

// ============================================
// Save Indicator Component - Premium Dark Theme
// ============================================

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error?: string | null;
  className?: string;
}

export default function SaveIndicator({
  isSaving,
  lastSaved,
  error,
  className,
}: SaveIndicatorProps) {
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>('');

  // Update relative time every minute
  useEffect(() => {
    if (!lastSaved) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);

      if (seconds < 5) {
        setTimeSinceLastSave('Just now');
      } else if (seconds < 60) {
        setTimeSinceLastSave('Saved quietly');
      } else if (minutes < 60) {
        setTimeSinceLastSave(`${minutes}m ago`);
      } else {
        setTimeSinceLastSave(
          lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-red-400',
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span>Failed to save</span>
      </div>
    );
  }

  // Saving state
  if (isSaving) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-zinc-400',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-accent-400" />
        <span>Saving...</span>
      </div>
    );
  }

  // Saved state
  if (lastSaved) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-zinc-500 transition-opacity',
          className
        )}
      >
        <Cloud className="h-4 w-4 text-accent-400" />
        <Check className="h-3 w-3 -ml-1 text-green-400" />
        <span>{timeSinceLastSave}</span>
      </div>
    );
  }

  // Default - no saves yet
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm text-zinc-500',
        className
      )}
    >
      <Cloud className="h-4 w-4" />
      <span>Not saved yet</span>
    </div>
  );
}
