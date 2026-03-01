import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-blush-300 rounded-full blur-[100px] opacity-30 animate-float-slow" />
        <div className="absolute bottom-20 -left-36 w-72 h-72 bg-rose-400 rounded-full blur-[100px] opacity-25 animate-float-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative glass-card p-12 max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="font-serif text-8xl text-blush-300 mb-4 opacity-60">
          404
        </div>

        <h1 className="font-serif text-3xl text-coffee-300 mb-3">
          Page not found
        </h1>
        
        <p className="text-coffee-300/70 mb-8">
          This page seems to have wandered off. Let&apos;s get you back to a safe space.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-8 py-3 bg-coffee-300 text-cream-50 rounded-full font-medium shadow-soft hover:shadow-soft-lg hover:bg-coffee-400 transform hover:-translate-y-0.5 transition-all duration-300">
            Go home
          </Link>
          
          <Link href="/dashboard" className="px-8 py-3 bg-transparent text-coffee-300 rounded-full font-medium border-2 border-blush-300 hover:border-rose-400 hover:bg-white/30 transition-all duration-300">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
