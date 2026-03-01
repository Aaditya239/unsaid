// ============================================
// Track Display Title Mappings
// ============================================
// Maps track indices to premium emotional display names
// Actual file names remain unchanged
// ============================================

export interface TrackDisplayInfo {
  title: string;
  subtitle?: string;
}

export type MusicCategory = 'calm' | 'focus' | 'energy' | 'emotional' | 'night';

// Display titles for each category - indexed by track number (0-based)
export const TRACK_DISPLAY_TITLES: Record<MusicCategory, TrackDisplayInfo[]> = {
  calm: [
    { title: 'Quiet Horizon', subtitle: 'Peaceful ambient' },
    { title: 'Soft Morning Light', subtitle: 'Gentle awakening' },
    { title: 'Floating Thoughts', subtitle: 'Mindful drift' },
    { title: 'Gentle Stillness', subtitle: 'Calm presence' },
    { title: 'Whispering Sky', subtitle: 'Serene clouds' },
    { title: 'Tranquil Waters', subtitle: 'Flowing peace' },
    { title: 'Silent Meadow', subtitle: 'Open fields' },
    { title: 'Velvet Dusk', subtitle: 'Evening calm' },
    { title: 'Misty Dreams', subtitle: 'Soft haze' },
    { title: 'Eternal Calm', subtitle: 'Deep serenity' },
  ],
  focus: [
    { title: 'Deep Work State', subtitle: 'Maximum concentration' },
    { title: 'Clarity Mode', subtitle: 'Mental sharpness' },
    { title: 'Cognitive Flow', subtitle: 'Productive stream' },
    { title: 'Silent Productivity', subtitle: 'Focused silence' },
    { title: 'Laser Focus', subtitle: 'Single-minded' },
    { title: 'Mind Engine', subtitle: 'Processing power' },
    { title: 'The Zone', subtitle: 'Peak performance' },
    { title: 'Sharp Mind', subtitle: 'Clear thinking' },
    { title: 'Flow State', subtitle: 'Effortless work' },
    { title: 'Deep Thought', subtitle: 'Contemplation' },
  ],
  energy: [
    { title: 'Forward Motion', subtitle: 'Unstoppable momentum' },
    { title: 'Rise Up', subtitle: 'Ascending power' },
    { title: 'Momentum', subtitle: 'Building force' },
    { title: 'Power Within', subtitle: 'Inner strength' },
    { title: 'Limitless Drive', subtitle: 'No boundaries' },
    { title: 'Electric Pulse', subtitle: 'Vibrant energy' },
    { title: 'Breakthrough', subtitle: 'Breaking barriers' },
    { title: 'Unstoppable', subtitle: 'Pure determination' },
    { title: 'Ignite', subtitle: 'Spark of fire' },
    { title: 'Full Throttle', subtitle: 'Maximum power' },
  ],
  emotional: [
    { title: 'Inner Reflection', subtitle: 'Looking within' },
    { title: 'Heavy Heart', subtitle: 'Deep feelings' },
    { title: 'Quiet Healing', subtitle: 'Gentle recovery' },
    { title: 'Fading Memories', subtitle: 'Letting go' },
    { title: 'Gentle Release', subtitle: 'Emotional freedom' },
    { title: 'Tears of Grace', subtitle: 'Cleansing rain' },
    { title: 'Tender Moments', subtitle: 'Soft emotions' },
    { title: 'Bittersweet', subtitle: 'Mixed feelings' },
    { title: 'Soul Whispers', subtitle: 'Inner voice' },
    { title: 'Heartstrings', subtitle: 'Deep connection' },
  ],
  night: [
    { title: 'Midnight Drift', subtitle: 'Late hour peace' },
    { title: 'After Hours', subtitle: 'Quiet darkness' },
    { title: 'Moonlit Calm', subtitle: 'Silver light' },
    { title: 'Slow Fade', subtitle: 'Drifting away' },
    { title: 'Night Silence', subtitle: 'Deep stillness' },
    { title: 'Starlight Lullaby', subtitle: 'Cosmic sleep' },
    { title: 'Dream Weaver', subtitle: 'Night visions' },
    { title: 'Twilight Rest', subtitle: 'Evening sanctuary' },
    { title: 'Nocturnal Peace', subtitle: 'Night comfort' },
    { title: 'Sleep Embrace', subtitle: 'Gentle rest' },
  ],
};

/**
 * Get display title for a track
 * @param category - Music category
 * @param index - Track index (0-based)
 * @returns Display title info or fallback
 */
export function getTrackDisplayTitle(category: MusicCategory, index: number): TrackDisplayInfo {
  const categoryTitles = TRACK_DISPLAY_TITLES[category];
  if (categoryTitles && categoryTitles[index]) {
    return categoryTitles[index];
  }
  // Fallback for tracks beyond the defined list
  return {
    title: `Track ${index + 1}`,
    subtitle: category.charAt(0).toUpperCase() + category.slice(1),
  };
}
