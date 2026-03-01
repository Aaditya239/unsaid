import { useState } from 'react';
import { JournalEntry, getEmotionInfo } from '@/lib/journal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Music, Play, Pause } from 'lucide-react';
import Link from 'next/link';

interface JournalCardProps {
  entry: JournalEntry;
  className?: string;
}

export default function JournalCard({ entry, className }: JournalCardProps) {
  const emotionInfo = entry.emotion ? getEmotionInfo(entry.emotion) : null;

  // Get first 150 characters of content for preview
  const contentPreview = entry.content.length > 150
    ? entry.content.substring(0, 150) + '...'
    : entry.content;

  // Format date
  const formattedDate = format(new Date(entry.createdAt), 'MMMM d, yyyy • h:mm a');

  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={cn("block w-full", className)}>
      <article
        className="group relative overflow-hidden transition-all duration-300
                   bg-[rgba(255,255,255,0.04)]
                   backdrop-blur-[16px]
                   border border-[rgba(255,255,255,0.06)]
                   rounded-[20px]
                   shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                   hover:bg-[rgba(255,255,255,0.06)]
                   hover:border-[rgba(255,255,255,0.1)]
                   p-6 sm:p-8 flex flex-col gap-[24px]"
      >
        <Link href={`/journal/${entry.id}`} className="absolute inset-0 z-0"></Link>

        {/* Header: Title and Date */}
        <div className="flex flex-col gap-1 relative z-10 pointer-events-none">
          <h3 className="text-[22px] font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-1">
            {entry.title || 'Untitled Entry'}
          </h3>
          <span className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
            {formattedDate}
          </span>
        </div>

        {/* Text Content */}
        <p className="text-[16px] leading-[1.6] text-white/70 line-clamp-4 relative z-10 pointer-events-none group-hover:text-white/80 transition-colors">
          {contentPreview}
        </p>

        {/* Image Attachment (if exists) */}
        {entry.imageUrl && (
          <div className="relative z-10 w-full rounded-[16px] overflow-hidden pointer-events-none">
            <img
              src={entry.imageUrl}
              alt="Journal Attachment"
              className="w-full h-auto max-h-[350px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Audio Player (Hidden Video) */}
        {entry.musicVideoId && (
          <div className="relative z-10 w-full rounded-[16px] overflow-hidden bg-white/[0.03] border border-white/5 p-3 flex items-center gap-4 group/player">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
              <img src={entry.musicThumbnail || ''} alt="" className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity"
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Music className="w-3 h-3 text-[#4F7CFF]" />
                <span className="text-[10px] text-[#4F7CFF] font-black uppercase tracking-[0.1em]">Audio Only</span>
              </div>
              <h4 className="text-[14px] font-semibold text-white truncate leading-tight" dangerouslySetInnerHTML={{ __html: entry.musicTitle || '' }}></h4>
              <p className="text-white/40 text-[12px] truncate">{entry.musicArtist}</p>
            </div>

            {isPlaying && (
              <div className="flex items-center gap-1 pr-1">
                <div className="w-0.5 h-3 bg-[#4F7CFF] animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                <div className="w-0.5 h-4 bg-[#4F7CFF] animate-[music-bar_1s_ease-in-out_infinite_0.1s]"></div>
                <div className="w-0.5 h-2 bg-[#4F7CFF] animate-[music-bar_0.6s_ease-in-out_infinite_0.2s]"></div>
              </div>
            )}

            {/* The actual player - hidden but functional */}
            <div className="absolute opacity-0 pointer-events-none w-1 h-1">
              {isPlaying && (
                <iframe
                  src={`https://www.youtube.com/embed/${entry.musicVideoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1`}
                  width="1"
                  height="1"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              )}
            </div>
          </div>
        )}

        {/* Footer: Mood Tag */}
        {emotionInfo && (
          <div className="flex relative z-10 pointer-events-none mt-auto">
            <span
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300',
                'bg-white/[0.04] border border-white/[0.05] text-white/70',
                'group-hover:bg-white/[0.08] group-hover:text-white group-hover:border-white/[0.1]'
              )}
            >
              <span className="text-[16px] drop-shadow-sm">{emotionInfo.emoji}</span>
              <span className="tracking-wide">{emotionInfo.label}</span>
            </span>
          </div>
        )}
      </article>
    </div>
  );
}
