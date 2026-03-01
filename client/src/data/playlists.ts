// ============================================
// LOCAL MUSIC PLAYLIST DATA SYSTEM
// Premium Indian Music Categories
// ============================================

export type MusicCategory = 'calm' | 'emotional' | 'energy' | 'focus' | 'night';

export interface Song {
  id: string;
  title: string;
  artist: string;
  src: string;
  duration?: string;
  cover?: string;
}

export interface Playlist {
  id: string;
  category: MusicCategory;
  title: string;
  description: string;
  gradient: string;
  songs: Song[];
}

// ============================================
// PLAYLIST DEFINITIONS
// ============================================

export const playlists: Playlist[] = [
  {
    id: 'calm-vibes',
    category: 'calm',
    title: 'Calm Vibes',
    description: 'Peaceful melodies for relaxation and inner peace',
    gradient: 'from-teal-500/20 to-cyan-600/20',
    songs: [
      { id: 'calm-1', title: 'Ocean Breeze', artist: 'Nature Sounds', src: '/music/calm/ocean-breeze.mp3', duration: '4:32' },
      { id: 'calm-2', title: 'Morning Dew', artist: 'Ambient Dreams', src: '/music/calm/morning-dew.mp3', duration: '3:45' },
      { id: 'calm-3', title: 'Gentle Rain', artist: 'Sleep Therapy', src: '/music/calm/gentle-rain.mp3', duration: '5:12' },
      { id: 'calm-4', title: 'Forest Whispers', artist: 'Nature Sounds', src: '/music/calm/forest-whispers.mp3', duration: '4:18' },
      { id: 'calm-5', title: 'Sunset Meditation', artist: 'Zen Masters', src: '/music/calm/sunset-meditation.mp3', duration: '6:24' },
    ],
  },
  {
    id: 'emotional-journey',
    category: 'emotional',
    title: 'Emotional Journey',
    description: 'Heartfelt melodies for reflective moments',
    gradient: 'from-purple-500/20 to-pink-600/20',
    songs: [
      { id: 'emo-1', title: 'Memories', artist: 'Piano Dreams', src: '/music/emotional/memories.mp3', duration: '4:15' },
      { id: 'emo-2', title: 'Lost in Time', artist: 'Strings Ensemble', src: '/music/emotional/lost-in-time.mp3', duration: '5:02' },
      { id: 'emo-3', title: 'Teardrops', artist: 'Melody Heart', src: '/music/emotional/teardrops.mp3', duration: '3:58' },
      { id: 'emo-4', title: 'Nostalgia', artist: 'Piano Dreams', src: '/music/emotional/nostalgia.mp3', duration: '4:45' },
      { id: 'emo-5', title: 'Silent Words', artist: 'Acoustic Soul', src: '/music/emotional/silent-words.mp3', duration: '4:22' },
    ],
  },
  {
    id: 'energy-boost',
    category: 'energy',
    title: 'Energy Boost',
    description: 'High-energy tracks to fuel your motivation',
    gradient: 'from-orange-500/20 to-red-600/20',
    songs: [
      { id: 'energy-1', title: 'Rise Up', artist: 'Power Beats', src: '/music/energy/rise-up.mp3', duration: '3:28' },
      { id: 'energy-2', title: 'Unstoppable', artist: 'Momentum', src: '/music/energy/unstoppable.mp3', duration: '3:45' },
      { id: 'energy-3', title: 'Victory March', artist: 'Epic Orchestra', src: '/music/energy/victory-march.mp3', duration: '4:12' },
      { id: 'energy-4', title: 'Fire Within', artist: 'Power Beats', src: '/music/energy/fire-within.mp3', duration: '3:56' },
      { id: 'energy-5', title: 'Champion', artist: 'Momentum', src: '/music/energy/champion.mp3', duration: '4:08' },
    ],
  },
  {
    id: 'deep-focus',
    category: 'focus',
    title: 'Deep Focus',
    description: 'Concentration-enhancing ambient sounds',
    gradient: 'from-blue-500/20 to-indigo-600/20',
    songs: [
      { id: 'focus-1', title: 'Flow State', artist: 'Focus Labs', src: '/music/focus/flow-state.mp3', duration: '5:30' },
      { id: 'focus-2', title: 'Mind Clear', artist: 'Productivity', src: '/music/focus/mind-clear.mp3', duration: '4:45' },
      { id: 'focus-3', title: 'Deep Work', artist: 'Focus Labs', src: '/music/focus/deep-work.mp3', duration: '6:12' },
      { id: 'focus-4', title: 'Zen Coding', artist: 'Lo-Fi Beats', src: '/music/focus/zen-coding.mp3', duration: '4:58' },
      { id: 'focus-5', title: 'Alpha Waves', artist: 'Brain Sync', src: '/music/focus/alpha-waves.mp3', duration: '7:15' },
    ],
  },
  {
    id: 'night-mode',
    category: 'night',
    title: 'Night Mode',
    description: 'Soothing sounds for peaceful sleep',
    gradient: 'from-slate-600/20 to-gray-800/20',
    songs: [
      { id: 'night-1', title: 'Starlight', artist: 'Dream Weaver', src: '/music/night/starlight.mp3', duration: '5:45' },
      { id: 'night-2', title: 'Midnight Sky', artist: 'Sleep Sounds', src: '/music/night/midnight-sky.mp3', duration: '6:30' },
      { id: 'night-3', title: 'Lunar Dreams', artist: 'Dream Weaver', src: '/music/night/lunar-dreams.mp3', duration: '8:12' },
      { id: 'night-4', title: 'Night Breeze', artist: 'Nature Ambient', src: '/music/night/night-breeze.mp3', duration: '5:58' },
      { id: 'night-5', title: 'Deep Sleep', artist: 'Sleep Sounds', src: '/music/night/deep-sleep.mp3', duration: '10:00' },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getPlaylistByCategory = (category: MusicCategory): Playlist | undefined => {
  return playlists.find((p) => p.category === category);
};

export const getPlaylistById = (id: string): Playlist | undefined => {
  return playlists.find((p) => p.id === id);
};

export const getSongById = (songId: string): Song | undefined => {
  for (const playlist of playlists) {
    const song = playlist.songs.find((s) => s.id === songId);
    if (song) return song;
  }
  return undefined;
};

export const getAllSongs = (): Song[] => {
  return playlists.flatMap((p) => p.songs);
};

export const getCategoryIcon = (category: MusicCategory): string => {
  const icons: Record<MusicCategory, string> = {
    calm: '🌊',
    emotional: '💜',
    energy: '⚡',
    focus: '🎯',
    night: '🌙',
  };
  return icons[category];
};

export const getCategoryColor = (category: MusicCategory): string => {
  const colors: Record<MusicCategory, string> = {
    calm: 'text-teal-400',
    emotional: 'text-purple-400',
    energy: 'text-orange-400',
    focus: 'text-blue-400',
    night: 'text-slate-400',
  };
  return colors[category];
};
