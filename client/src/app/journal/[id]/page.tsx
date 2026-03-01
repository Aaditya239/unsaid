'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJournalStore } from '@/stores/journalStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useTheme } from '@/hooks/useTheme';
import { Emotion } from '@/lib/journal';
import { ArrowLeft, Trash2, Mic, MicOff, Eye, EyeOff, Maximize2, Image as ImageIcon, Music, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import YouTubeMusicSearchModal from '@/components/journal/YouTubeMusicSearchModal';
import { uploadImageFile, YouTubeMusic } from '@/lib/journal';

// ============================================
// MOOD SEGMENTS
// ============================================
const SEGMENTS: { label: string; value: Emotion }[] = [
  { label: 'Calm', value: 'CALM' },
  { label: 'Happy', value: 'HAPPY' },
  { label: 'Anxious', value: 'ANXIOUS' },
  { label: 'Low', value: 'SAD' }
];

const AUTO_SAVE_DELAY = 3000;

export default function JournalEditorPage() {
  return (
    <ProtectedRoute>
      <JournalEditorContent />
    </ProtectedRoute>
  );
}

function JournalEditorContent() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const {
    currentEntry,
    isLoading,
    isUpdating,
    isCreating,
    isSaving,
    error,
    fetchEntry,
    updateEntry,
    createEntry,
    deleteEntry,
    setCurrentEntry,
  } = useJournalStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [musicMetadata, setMusicMetadata] = useState<Partial<YouTubeMusic> | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Feature States
  const [focusMode, setFocusMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Voice to text
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-save logic
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEntry(entryId);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setCurrentEntry(null);
    };
  }, [entryId, fetchEntry, setCurrentEntry]);

  useEffect(() => {
    if (currentEntry) {
      setTitle(currentEntry.title || '');
      setContent(currentEntry.content);
      // Ensure we convert single emotion to array for the UI segment control
      setEmotions(currentEntry.emotion ? [currentEntry.emotion] : []);
      setImageUrl(currentEntry.imageUrl || null);
      if (currentEntry.musicVideoId) {
        setMusicMetadata({
          title: currentEntry.musicTitle || '',
          channelTitle: currentEntry.musicArtist || '',
          thumbnail: currentEntry.musicThumbnail || '',
          videoId: currentEntry.musicVideoId || '',
          url: currentEntry.musicUrl || ''
        });
      }
      setHasUnsavedChanges(false);
    }
  }, [currentEntry]);

  // Handle Escape for Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB image allowed.");
      return;
    }

    try {
      setIsUploadingImage(true);
      const url = await uploadImageFile(file);
      setImageUrl(url);
      triggerAutoSave(title, content, emotions, url, musicMetadata);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);

  const handleMusicSelect = (music: YouTubeMusic) => {
    setMusicMetadata(music);
    setShowMusicModal(false);
    triggerAutoSave(title, content, emotions, imageUrl, music);
  };

  const removeMusic = () => {
    setMusicMetadata(null);
    setIsPlaying(false);
    triggerAutoSave(title, content, emotions, imageUrl, null);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentTranscript += transcript + ' ';
          }
        }
        if (currentTranscript) {
          setContent(prev => {
            const newContent = prev + (prev.endsWith(' ') ? '' : ' ') + currentTranscript;
            triggerAutoSave(title, newContent, emotions);
            return newContent;
          });
        }
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, [title, emotions]);

  const performSave = useCallback(async (titleToSave: string, contentToSave: string, emotionsToSave: Emotion[], imgUrl: string | null = imageUrl, musicMeta: Partial<YouTubeMusic> | null = musicMetadata) => {
    if (!contentToSave.trim() && !titleToSave.trim()) return;

    try {
      const selectedEmotion = emotionsToSave.length > 0 ? emotionsToSave[0] : undefined;
      const payload = {
        title: titleToSave.trim() || undefined,
        content: contentToSave.trim() || ' ',
        emotion: selectedEmotion,
        imageUrl: imgUrl,
        musicTitle: musicMeta?.title,
        musicArtist: musicMeta?.channelTitle,
        musicThumbnail: musicMeta?.thumbnail,
        musicVideoId: musicMeta?.videoId,
        musicUrl: musicMeta?.url,
        musicPlatform: 'YOUTUBE'
      };

      if (currentEntry) {
        await updateEntry(entryId, payload);
      } else {
        const newEntry = await createEntry(payload);
        router.replace(`/journal/${newEntry.id}`);
      }
      setHasUnsavedChanges(false);
    } catch {
      // Error handled
    }
  }, [currentEntry, entryId, updateEntry, createEntry, router, musicMetadata]);

  const triggerAutoSave = useCallback((t = title, text = content, emos = emotions, imgUrl = imageUrl, musicMeta = musicMetadata) => {
    setHasUnsavedChanges(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(t, text, emos, imgUrl, musicMeta);
    }, AUTO_SAVE_DELAY);
  }, [title, content, emotions, imageUrl, musicMetadata, performSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerAutoSave(e.target.value, content, emotions);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    triggerAutoSave(title, e.target.value, emotions);
  };

  const toggleEmotion = (val: Emotion) => {
    const newEmotions = emotions.includes(val)
      ? emotions.filter(e => e !== val)
      : [...emotions, val];
    setEmotions(newEmotions);
    triggerAutoSave(title, content, newEmotions);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported in this browser.');
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await performSave(title, content, emotions);
    router.push('/journal');
  };

  const handleDelete = async () => {
    try {
      await deleteEntry(entryId);
      router.push('/journal');
    } catch { }
  };

  const t = useTheme();

  if (isLoading && !currentEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={t.pageBg}>
        <div className="w-8 h-8 rounded-full border-2 border-t-white/60 border-white/20 animate-spin"></div>
      </div>
    );
  }

  const canSave = content.trim() || title.trim();

  return (
    <div className={`min-h-screen font-sans pb-32 transition-colors duration-500 relative overflow-hidden ${isMounted ? 'opacity-100' : 'opacity-0'}`} style={t.pageBg}>
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={t.bgGradientStyle}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] z-0 pointer-events-none" style={t.glow1Style}></div>
      <div className="absolute inset-0 bg-black/40 mix-blend-overlay z-0 pointer-events-none"></div>

      {/* Header */}
      {!focusMode && (
        <nav className="relative z-20 sticky top-0 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between transition-all" style={t.navStyle}>
          <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
            <button
              onClick={() => router.push('/journal')}
              className="p-2 -ml-2 text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-medium text-white tracking-wide">Edit Entry</h1>
              {hasUnsavedChanges && (isSaving || isUpdating) && <span className="text-[12px] text-[#4F7CFF] ml-2 animate-pulse">Saving...</span>}
              {!hasUnsavedChanges && currentEntry && <span className="text-[12px] text-white/40 ml-2">Saved</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-white/40 hover:text-red-400 transition-colors rounded-full hover:bg-red-400/10">
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleManualSave}
                disabled={!canSave}
                className={`font-medium text-[15px] px-4 py-1.5 rounded-full transition-all duration-300 ${canSave ? 'bg-gradient-to-r from-[#4F8CFF] to-[#8A5CFF] text-white shadow-[0_0_15px_rgba(79,140,255,0.3)] hover:shadow-[0_0_25px_rgba(79,140,255,0.5)]' : 'bg-white/[0.04] text-white/20 cursor-not-allowed'}`}
              >
                Save
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Editing Canvas */}
      <main className={`relative z-10 max-w-3xl mx-auto px-4 ${focusMode ? 'pt-24' : 'pt-8'} transition-all duration-500`}>
        {/* Date Display */}
        {currentEntry && !focusMode && (
          <div className="mb-6 px-2 flex flex-col gap-3">
            <h2 className="text-[14px] font-medium text-white/40 uppercase tracking-wider">
              {format(new Date(currentEntry.createdAt), 'EEEE, MMMM d, yyyy • h:mm a')}
            </h2>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title"
              className="w-full text-[28px] sm:text-[32px] font-semibold text-white bg-transparent outline-none placeholder:text-white/20 border-b border-white/[0.05] focus:border-[#4F7CFF]/50 transition-colors duration-300 pb-3"
            />

            {/* Mood Selector - Moved Above */}
            <div className="mt-6 mb-2">
              <h4 className="text-[13px] font-medium text-white/40 uppercase tracking-wider mb-4 px-2">How are you feeling?</h4>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {SEGMENTS.map((seg) => {
                  const isSelected = emotions.includes(seg.value);
                  return (
                    <button
                      key={seg.value}
                      onClick={() => toggleEmotion(seg.value)}
                      className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-300 ${isSelected
                        ? 'bg-gradient-to-r from-[#4F8CFF] to-[#8A5CFF] text-white shadow-[0_0_20px_rgba(79,140,255,0.3)] border border-white/[0.1]'
                        : 'bg-white/[0.03] border border-white/[0.05] text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                        }`}
                    >
                      {seg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-[14px] p-4 mb-6 text-[14px] backdrop-blur-sm">{error}</div>}

        {/* Media Controls */}
        <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 ${focusMode ? 'opacity-20 hover:opacity-100 transition-opacity absolute top-6 right-6' : ''}`}>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-250 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 text-white/70 border border-white/[0.05]`}>
              {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageUpload}
            />

            <button onClick={() => setShowMusicModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-250 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.05] ${musicMetadata ? 'text-[#4F7CFF] border-[#4F7CFF]/30 bg-[#4F7CFF]/5' : ''}`}>
              <Music className="w-4 h-4" /> {musicMetadata ? 'Change Music' : 'Music'}
            </button>
            <button onClick={toggleRecording} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-250 ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.05]'}`}>
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {isRecording ? 'Listening' : 'Dictate'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPreviewMode(!previewMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-250 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.05]`}>
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} Preview
            </button>
            <button onClick={() => setFocusMode(!focusMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-250 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 border border-white/[0.05]`}>
              <Maximize2 className="w-4 h-4" /> Focus
            </button>
          </div>
        </div>

        {/* Music Search Modal */}
        <YouTubeMusicSearchModal
          isOpen={showMusicModal}
          onClose={() => setShowMusicModal(false)}
          onSelect={handleMusicSelect}
        />

        {/* Text Area */}
        <div className={`${focusMode ? 'bg-transparent border-none' : 'bg-white/[0.02] backdrop-blur-xl rounded-[24px] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.05)]'} p-6 sm:p-8 mb-8 transition-all duration-300`}>
          {imageUrl && (
            <div className="relative mb-6 rounded-2xl overflow-hidden group">
              <img src={imageUrl} alt="Journal Attachment" className="w-full max-h-[350px] object-cover rounded-2xl" />
              <button
                onClick={() => { setImageUrl(null); triggerAutoSave(title, content, emotions, null, musicMetadata); }}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {musicMetadata && (
            <div className="relative mb-6 group/player">
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                  <img src={musicMetadata.thumbnail} alt={musicMetadata.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-opacity"
                  >
                    {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white fill-white ml-1" />}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-3 h-3 text-[#4F7CFF]" />
                    <span className="text-[10px] text-[#4F7CFF] font-black uppercase tracking-[0.2em]">Audio Only Mode</span>
                  </div>
                  <h3 className="text-white font-semibold truncate leading-tight text-[18px]" dangerouslySetInnerHTML={{ __html: musicMetadata.title || '' }}></h3>
                  <p className="text-white/40 text-sm truncate">{musicMetadata.channelTitle}</p>

                  {isPlaying && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1 h-4 bg-[#4F7CFF] animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                      <div className="w-1 h-6 bg-[#4F7CFF] animate-[music-bar_1s_ease-in-out_infinite_0.1s]"></div>
                      <div className="w-1 h-3 bg-[#4F7CFF] animate-[music-bar_0.6s_ease-in-out_infinite_0.2s]"></div>
                      <span className="text-[11px] text-[#4F7CFF]/60 font-medium ml-2 uppercase tracking-widest">Playing audio...</span>
                    </div>
                  )}

                  <div className="absolute opacity-0 pointer-events-none w-1 h-1">
                    {isPlaying && (
                      <iframe
                        width="1"
                        height="1"
                        src={`https://www.youtube.com/embed/${musicMetadata.videoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    )}
                  </div>
                </div>
                <button
                  onClick={removeMusic}
                  className="p-2 bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          {previewMode ? (
            <div className="prose prose-invert prose-blue max-w-none min-h-[300px] text-[17px] leading-[1.8]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*Nothing written yet...*'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind? (Markdown supported)"
              className={`w-full min-h-[350px] text-[17px] leading-[1.8] bg-transparent border-none outline-none resize-none text-white/90 placeholder:text-white/20`}
              style={{ caretColor: '#4F7CFF' }}
              autoFocus
            />
          )}
        </div>



      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative bg-[#0F172A] border border-white/[0.08] w-full max-w-sm rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="p-6 text-center">
                <h3 className="text-[18px] font-medium text-white mb-2">Delete this reflection?</h3>
                <p className="text-[14px] text-white/50 mb-8">This action cannot be undone and will permanently remove this entry from your device.</p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDelete}
                    className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-medium rounded-xl text-[15px] hover:bg-red-500/20 transition-all duration-250 active:scale-[0.98]"
                  >
                    Delete Entry
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-3 bg-white/[0.04] text-white/80 font-medium rounded-xl text-[15px] hover:bg-white/[0.08] transition-all duration-250 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
