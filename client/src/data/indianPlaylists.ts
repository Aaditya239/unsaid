export type IndianPlaylistMood = 'happy' | 'energy' | 'sad' | 'calm' | 'spiritual' | 'focus';

export interface IndianPlaylist {
  id: string;
  title: string;
  mood: IndianPlaylistMood;
  playlistId: string;
  description: string;
}

export const indianPlaylists: IndianPlaylist[] = [
  {
    id: 'bollywood',
    title: 'Bollywood Top Songs',
    mood: 'happy',
    playlistId: 'PLmfcCDSUSykbw9ewtVgSDKazPDwoTBm8E',
    description: 'Feel-good Bollywood chartbusters with timeless energy.',
  },
  {
    id: 'punjabi',
    title: 'Punjabi Hits',
    mood: 'energy',
    playlistId: 'PLO7-VO1D0_6NmK47v6tpOcxurcxdW-hZa',
    description: 'High-energy Punjabi tracks for momentum and motivation.',
  },
  {
    id: 'sad',
    title: 'Sad Mood',
    mood: 'sad',
    playlistId: 'PLgzTt0k8mXzHcKebL8d0uYHfawiARhQja',
    description: 'Emotional and heartfelt songs for reflective moments.',
  },
  {
    id: 'calm',
    title: 'Chill & Calm',
    mood: 'calm',
    playlistId: 'PLgzTt0k8mXzEpH7-dOCHqRZOsakqXmzmG',
    description: 'Relaxing Indian calm vibes to slow down and breathe.',
  },
  {
    id: 'devotional',
    title: 'Devotional',
    mood: 'spiritual',
    playlistId: 'PLEFoSN6SYS5TZvuiRtOW8Q6DFjMdT7X0i',
    description: 'Peaceful devotional tracks for grounding and stillness.',
  },
  {
    id: 'indian-lofi',
    title: 'Indian Lofi',
    mood: 'focus',
    playlistId: 'PLuH-I1ovyzeioJ_j4DcQgoxtAbgBc3YD2',
    description: 'Soft Indian lofi blends for focused, low-distraction work.',
  },
];
