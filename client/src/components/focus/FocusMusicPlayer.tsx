'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Youtube } from 'lucide-react';
import { PlaylistSection } from './PlaylistSection';
import { YouTubeSection } from './YouTubeSection';
import { cn } from '@/lib/utils';

// ============================================
// TAB NAVIGATION
// ============================================

type TabId = 'local' | 'youtube';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'local', label: 'Local Music', icon: Music },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function FocusMusicPlayer() {
  const [activeTab, setActiveTab] = useState<TabId>('local');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-full w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/[0.1] text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-white/[0.05]'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              <Icon className={cn('w-4 h-4', tab.id === 'youtube' && 'text-red-400')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'local' ? <PlaylistSection /> : <YouTubeSection />}
      </motion.div>
    </div>
  );
}
