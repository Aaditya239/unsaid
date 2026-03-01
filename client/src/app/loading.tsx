export default function Loading() {
  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center">
      {/* Soft pulsing loader */}
      <div className="flex flex-col items-center gap-6">
        {/* Animated circles */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-blush-300/40 animate-ping absolute" />
          <div className="w-16 h-16 rounded-full bg-blush-300 flex items-center justify-center relative">
            <div className="w-8 h-8 rounded-full bg-rose-400/60 animate-pulse" />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="font-serif text-xl text-coffee-300/60 animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
