import Link from 'next/link';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1A35] to-[#0B1220] flex flex-col relative overflow-hidden font-sans selection:bg-electric/30 selection:text-white">
      {/* Subtle Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjFfIi8+Cgk8cGF0aCBkPSJNMCAwdjRoNHYtNEgweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjBfIi8+Cjwvc3ZnPg==')] pointer-events-none"></div>

      {/* Subtle radial light glow top right */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial-electric opacity-[0.05] blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 py-8 px-8 flex justify-between items-center animate-fade-in">
        <Link href="/" className="font-serif text-2xl text-softwhite tracking-wide hover:text-white transition-colors duration-300 flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric to-lavenderglow flex items-center justify-center">
            <span className="w-2 h-2 bg-white rounded-full"></span>
          </div>
          UNSAID
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-6 animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
        <div className="w-full max-w-[440px] relative group">
          {/* Card Border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[28px] opacity-50 pointer-events-none"></div>

          <div className="bg-[#ffffff0f] backdrop-blur-[25px] border border-white/10 rounded-[28px] p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.35)] relative overflow-hidden">
            {/* Subtle inner top-left reflection */}
            <div className="absolute inset-0 rounded-[28px] border-t border-l border-white/5 pointer-events-none"></div>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-8 text-center text-xs text-softwhite/30 tracking-wide font-light">
        <p>&copy; {new Date().getFullYear()} UNSAID. Secure transmission.</p>
      </footer>
    </div>
  );
}
