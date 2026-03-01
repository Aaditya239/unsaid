'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IndianPlaylist } from '@/data/indianPlaylists';

interface PlaylistCardProps {
  playlist: IndianPlaylist;
  isSelected: boolean;
  onSelect: (playlistId: string) => void;
}

export function PlaylistCard({
  playlist,
  isSelected,
  onSelect,
}: PlaylistCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(playlist.id)}
      className={cn(
        'group relative w-full text-left p-6 rounded-[24px] border shadow-lg',
        'bg-white/10 backdrop-blur-xl border-white/20',
        'transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.35)]',
        isSelected && 'border-white/40 bg-white/15',
      )}
    >
      <div>
        <h3 className="text-[18px] font-semibold text-white tracking-tight">{playlist.title}</h3>
        <p className="mt-2 text-[14px] text-white/70 leading-relaxed">{playlist.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isSelected && (
          <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[12px] font-medium text-white/85">
            Playing now
          </span>
        )}
      </div>
    </motion.button>
  );
}
