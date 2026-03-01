'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

// ============================================
// NAVBAR COMPONENT
// ============================================
function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out border-b ${scrolled
        ? 'bg-navy-900/60 backdrop-blur-3xl border-electric/20 shadow-[0_4px_30px_rgba(59,130,246,0.1)]'
        : 'bg-transparent border-transparent'
        }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-2xl md:text-3xl text-softwhite tracking-wide hover:text-white transition-colors duration-300 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric to-lavenderglow flex items-center justify-center shadow-glow-electric">
            <span className="w-3 h-3 bg-white rounded-full"></span>
          </div>
          UNSAID
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink href="/">Home</NavLink>
          <NavLink href="#about">About Us</NavLink>
          <NavLink href="#features">Features</NavLink>

          <div className="flex items-center gap-4 ml-6 border-l border-white/10 pl-6">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-gradient-to-r from-electric to-lavenderglow text-white rounded-full 
                           shadow-glow-electric hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-2.5 text-softwhite rounded-full border border-softwhite/10 hover:border-electric/50 hover:text-electric hover:shadow-glow-electric transition-all duration-300 bg-white/5 backdrop-blur-md"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-electric to-lavenderglow text-white rounded-full 
                             shadow-glow-electric hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all duration-300 relative group"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-softwhite hover:text-electric transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-navy-900/95 backdrop-blur-2xl border-b border-white/5 ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 border-transparent'
          }`}
      >
        <div className="container mx-auto px-6 py-4 space-y-4">
          <Link href="/" className="block text-softwhite hover:text-electric py-2">Home</Link>
          <Link href="#about" className="block text-softwhite hover:text-electric py-2">About Us</Link>
          <Link href="#features" className="block text-softwhite hover:text-electric py-2">Features</Link>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="block px-6 py-3 bg-gradient-to-r from-electric to-lavenderglow text-white text-center rounded-full shadow-glow-electric">Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="block px-6 py-3 border border-white/10 text-softwhite text-center rounded-full bg-white/5">Login</Link>
                <Link href="/auth/signup" className="block px-6 py-3 bg-gradient-to-r from-electric to-lavenderglow text-white text-center rounded-full shadow-glow-electric">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-softwhite/70 hover:text-white transition-colors duration-300
                 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-electric
                 after:transition-all after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}

// ============================================
// MAIN HOMEPAGE COMPONENT
// ============================================
export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-midnight text-softwhite font-sans overflow-hidden selection:bg-electric/30 selection:text-white relative">

      {/* ============================================
          FUTURISTIC CINEMATIC BACKGROUND
          ============================================ */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-midnight">
        {/* Soft, deep ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(15,23,42,0)_0%,rgba(11,17,32,1)_100%)]" />

        {/* Cinematic Film Grain Overlay (Simulated via very faint pattern) */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGheiWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjFfIi8+Cgk8cGF0aCBkPSJNMCAwdjRoNHYtNEgweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjBfIi8+Cjwvc3ZnPg==')]" />

        {/* 🌌 Top Center Vertical Light Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[800px] bg-gradient-to-b from-electric/20 via-lavenderglow/5 to-transparent blur-[60px] opacity-60 mix-blend-screen pointer-events-none" />

        {/* Deep, Soft depth of field floating lights */}
        <div
          className="absolute -top-60 -left-40 w-[800px] h-[800px] bg-electric rounded-full blur-[200px] opacity-[0.1] animate-blob"
          style={{ transform: `translateY(${offsetY * 0.05}px)` }}
        />
        <div
          className="absolute top-1/2 -right-60 w-[900px] h-[900px] bg-lavenderglow rounded-full blur-[220px] opacity-[0.08] animate-blob-slow"
          style={{ animationDelay: '2s', transform: `translateY(${offsetY * 0.08}px)` }}
        />

        {/* Volumetric Top Spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-radial-spotlight opacity-30 mix-blend-screen pointer-events-none" />

        {/* Soft Spotlight BEHIND Dashboard Right Side */}
        <div className="absolute top-1/4 right-[5%] w-[600px] h-[600px] bg-electric rounded-full blur-[150px] opacity-[0.15] animate-pulse-soft mix-blend-screen pointer-events-none" />

        {/* Cinematic Particles (Dust reminensant) */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-softwhite shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse-soft blur-[1px]" style={{ transform: `translateY(${offsetY * -0.15}px)` }} />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full bg-lavenderglow shadow-[0_0_15px_rgba(167,139,250,0.6)] animate-float-delayed blur-[1.5px]" style={{ transform: `translateY(${offsetY * -0.1}px)` }} />
        <div className="absolute bottom-1/3 left-1/5 w-0.5 h-0.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.6)] animate-float" style={{ transform: `translateY(${offsetY * -0.2}px)` }} />
      </div>

      <Navbar isAuthenticated={isAuthenticated} />

      {/* ============================================
          HERO SECTION (Split Layout)
          ============================================ */}
      <section className="relative z-10 pt-40 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-[95vh] flex items-center">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Content */}
          <div className="max-w-xl animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-8 bg-gradient-to-r from-electric to-transparent"></span>
              <span className="text-electric text-[11px] font-bold uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">Private. Encrypted. Intelligent.</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-softwhite to-bluegray-700 leading-[1.1] mb-6 tracking-tight drop-shadow-sm">
              A safe space for{' '}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-electric via-lavenderglow to-electric bg-[length:200%_auto] animate-gradient-shift">
                everything
                {/* Subtle underline glow */}
                <span className="absolute bottom-1 left-0 w-full h-1 bg-electric/50 blur-md -z-10 rounded-full animate-pulse-soft"></span>
              </span>{' '}
              you feel.
            </h1>
            <p className="text-lg md:text-xl text-bluegray-700/80 mb-10 leading-relaxed font-light text-softwhite/70">
              Step into your immersive emotional sanctuary. A premium, intelligent dashboard designed to help you process, reflect, and find clarity securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-gradient-to-r from-electric to-lavenderglow text-white rounded-full font-medium text-lg
                           shadow-cinematic-glow hover:shadow-[0_0_80px_rgba(59,130,246,0.8)] transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-center border border-white/20"
              >
                Launch Your Space
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white/5 backdrop-blur-xl text-softwhite rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/20
                           transform transition-all duration-300 text-center border border-white/10 flex items-center justify-center gap-2"
              >
                <span>View Features</span>
                <span className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse-soft blur-[1px]"></span>
              </Link>
            </div>
          </div>

          {/* Right: Floating Glass Dashboard (Apple-Style Depth Setup) */}
          <div className="relative h-[600px] w-full hidden md:flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Ambient Cinematic Back Glow */}
            <div className="absolute inset-0 bg-gradient-radial-electric opacity-40 blur-[80px] rounded-full scale-125 mix-blend-screen pointer-events-none"></div>

            {/* 3D Floating Orb behind dashboard */}
            <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-radial-electric opacity-50 blur-xl animate-float-delayed shadow-glow-electric"></div>

            {/* CSS Perspective wrapper with exaggerated depth */}
            <div className="relative w-full max-w-lg perspective-[1500px]">
              {/* Tilted Layered Dashboard Panel featuring realistic apple-level shadow */}
              <div className="w-full bg-navy-800/20 backdrop-blur-3xl rounded-[2rem] border-t border-white/20 border-l border-white/10 p-6 shadow-glass-panel 
                              transform rotate-y-[-15deg] rotate-x-[10deg] translate-z-10 hover:rotate-y-[-5deg] hover:rotate-x-[5deg] transition-transform duration-1000 ease-out relative overflow-hidden group animate-float">

                {/* Glass Inner Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                <div className="absolute inset-0 shadow-inner-glass rounded-3xl pointer-events-none"></div>

                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-softwhite/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-electric animate-pulse"></span>
                    Encrypted
                  </div>
                </div>

                {/* Grid Layout inside the Dashboard Panel */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Analytic Graph Widget */}
                  <div className="col-span-2 bg-white/5 rounded-2xl p-4 border border-white/10 relative overflow-hidden group/graph">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-electric/20 blur-3xl rounded-full"></div>
                    <h4 className="text-sm text-softwhite/80 font-medium mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-lavenderglow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                      Emotional Analytics
                    </h4>
                    <div className="h-24 flex items-end gap-2 px-2">
                      {[40, 60, 45, 80, 50, 90, 65].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-electric/80 to-lavenderglow/80 relative transition-all duration-500 hover:opacity-100 opacity-60 animate-pulse-soft" style={{ height: `${h}%`, animationDelay: `${i * 0.2}s` }}>
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] opacity-0 group-hover/graph:opacity-100 transition-opacity"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Companion Widget */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-navy-900 animate-pulse z-10"></div>
                    <h4 className="text-sm text-softwhite/80 font-medium mb-3">AI Companion</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric/20 to-lavenderglow/20 border border-lavenderglow/30 flex items-center justify-center relative">
                        <div className="w-4 h-4 rounded-full bg-lavenderglow shadow-glow-lavenderglow animate-pulse-soft"></div>
                        <svg className="w-5 h-5 absolute text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <div className="text-xs text-softwhite/50 flex flex-col items-start w-full">
                        <span className="flex space-x-1 items-center h-4 mb-0.5">
                          <span className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-electric rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        <span className="text-electric/70">Secure Mode</span>
                      </div>
                    </div>
                  </div>

                  {/* Private Note Widget */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col">
                    <h4 className="text-sm text-softwhite/80 font-medium mb-2">New Entry</h4>
                    <div className="flex-1 rounded-lg bg-navy-900/50 border border-white/5 p-2 font-mono text-xs text-softwhite/40 flex">
                      I feel... <span className="w-1.5 h-4 bg-lavenderglow ml-1 animate-pulse"></span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Floating abstract decorative elements in 3D space */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-electric/30 backdrop-blur-3xl rounded-2xl border border-white/10 transform translate-z-20 animate-float-delayed shadow-glow-electric flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full border-t-2 border-electric animate-spin"></div>
              </div>
              <div className="absolute -bottom-6 -left-8 w-16 h-16 bg-lavenderglow/30 backdrop-blur-3xl rounded-full border border-white/10 transform translate-z-30 animate-float shadow-glow-lavenderglow"></div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PREMIUM FEATURES SECTION (Cinematic Layering)
          ============================================ */}
      <section id="features" className="relative z-10 py-32 bg-midnight/80 backdrop-blur-2xl border-y border-white-[0.02] shadow-[0_-20px_80px_rgba(15,23,42,0.8)]">
        {/* Film grain noise overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjFfIi8+Cgk8cGF0aCBkPSJNMCAwdjRoNHYtNEgweiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjBfIi8+Cjwvc3ZnPg==')] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in-up">
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 drop-shadow-md">Designed for depth.</h2>
            <p className="text-softwhite/60 text-lg font-light">High-end architecture to secure and surface your thoughts intelligently.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Private Journal", icon: "📝", desc: "A minimal, distraction-free environment that saves automatically with military-grade encryption." },
              { title: "AI Emotional Companion", icon: "🧠", desc: "Context-aware models running securely to help you uncover underlying mental patterns." },
              { title: "Mood Analytics", icon: "🌌", desc: "Gorgeous translucent graphs visualising your emotional spikes and drops over time." },
              { title: "Voice Notes", icon: "🎙️", desc: "Seamless audio transcription that captures your inflections and analyzes tone accurately." },
              { title: "Secure Storage", icon: "🛡️", desc: "End-to-end encrypted datastores. Your data is invisible to everyone including us." },
              { title: "Deep Focus Mode", icon: "🧘", desc: "Block out the noise with ambient noise generators and full-screen immersion." },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-[2rem] bg-navy-800/20 backdrop-blur-[40px] border border-white/5 border-t-white/10 border-l-white/10
                           shadow-apple-card hover:shadow-glass-panel-hover transition-all duration-700 hover:-translate-y-2
                           relative overflow-hidden cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Cinematic Edge Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric/10 to-lavenderglow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-screen pointer-events-none"></div>
                <div className="absolute inset-0 shadow-inner-glass rounded-[2rem] pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-2xl shadow-inner-glass mb-6 
                                  group-hover:scale-110 group-hover:border-electric/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500">
                    <span className="drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">{feature.icon}</span>
                  </div>
                  <h3 className="font-serif text-2xl text-white mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-softwhite/50 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 1: OUR STORY
          ============================================ */}
      <section id="about" className="relative z-10 py-32 overflow-hidden bg-gradient-to-b from-[#0B1220] to-[#0E1A35]">
        {/* Soft abstract background blobs & particles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric rounded-full blur-[150px] opacity-[0.08] pointer-events-none animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-lavenderglow rounded-full blur-[150px] opacity-[0.08] pointer-events-none animate-blob-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial-spotlight opacity-20 pointer-events-none mix-blend-screen"></div>

        <div className="absolute inset-0 opacity-[0.3] pointer-events-none mix-blend-screen">
          {[
            { t: '15%', l: '20%', d: '0s' }, { t: '75%', l: '10%', d: '1s' }, { t: '45%', l: '85%', d: '2s' },
            { t: '25%', l: '75%', d: '0.5s' }, { t: '85%', l: '85%', d: '1.5s' }, { t: '55%', l: '35%', d: '2.5s' },
          ].map((pos, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-float" style={{ top: pos.t, left: pos.l, animationDelay: pos.d }}></div>
          ))}
        </div>

        <div className="container mx-auto px-6 text-center animate-fade-in relative z-10">
          <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-electric text-[11px] font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] mb-2">Our Story</span>
            <div className="w-12 h-[1px] bg-electric/50 animate-pulse-soft"></div>
          </div>
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-softwhite/80 mb-8 max-w-4xl mx-auto leading-tight drop-shadow-sm relative">
            <div className="absolute inset-0 bg-lavenderglow blur-[100px] opacity-20 -z-10 rounded-full"></div>
            “Built for the thoughts you never say out loud.”
          </h2>
          <p className="text-lg md:text-xl text-softwhite/70 max-w-2xl mx-auto font-light leading-relaxed">
            In a world of constant digital noise and oversharing, UNSAID was created as a private emotional sanctuary. No feeds, no followers. Just you and your thoughts.
          </p>
        </div>
      </section>

      {/* ============================================
          SECTION 2: THE PROBLEM (3 Glass Cards)
          ============================================ */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-[#0E1A35] to-[#0B1220]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              "We share everything — except how we truly feel.",
              "We stay strong on the outside while feeling heavy inside.",
              "We don’t have a safe space to reflect without judgment."
            ].map((text, i) => (
              <div
                key={i}
                className="group relative p-10 rounded-[2rem] bg-navy-800/30 backdrop-blur-3xl border border-white/5 border-t-white/10 border-l-white/10
                           shadow-apple-card hover:shadow-glass-panel-hover transition-all duration-700 hover:-translate-y-4 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {/* Subtle internal glow and animated shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-electric/10 to-lavenderglow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-gradient-shift opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <p className="font-serif text-[1.65rem] text-softwhite/90 leading-relaxed font-light relative z-10 drop-shadow-sm">"{text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: OUR MISSION
          ============================================ */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-[#0B1220] to-[#0E1A35]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-serif text-2xl text-electric tracking-[0.2em] mb-6 uppercase">Our Mission</h2>
          <h3 className="font-serif text-4xl md:text-5xl text-white max-w-4xl mx-auto leading-tight mb-24 drop-shadow-md">
            UNSAID exists to create a private emotional sanctuary powered by intelligence, not noise.
          </h3>

          <div className="relative max-w-5xl mx-auto">
            {/* Subtle animated connecting line behind pillars */}
            <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-electric/40 to-transparent hidden md:block overflow-hidden pointer-events-none">
              <div className="w-1/2 h-full bg-electric blur-sm animate-[shimmer_3s_infinite]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { title: "Private by Design", icon: "🔒" },
                { title: "Encrypted Reflections", icon: "🛡️" },
                { title: "AI That Listens", icon: "🧠" },
                { title: "Emotional Clarity", icon: "✨" },
              ].map((pillar, i) => (
                <div key={i} className="group bg-navy-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 relative z-10 hover:border-electric/30 transition-all duration-500 hover:-translate-y-3 shadow-apple-card hover:shadow-glass-panel-hover">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-6 shadow-inner-glass group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] group-hover:border-electric/50 transition-all duration-500 relative">
                    <div className="absolute inset-0 rounded-2xl bg-electric/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 drop-shadow-md">{pillar.icon}</span>
                  </div>
                  <h4 className="text-sm font-bold text-softwhite/90 uppercase tracking-widest leading-relaxed">{pillar.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: THE VISION
          ============================================ */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-[#0E1A35] to-[#0B1220] overflow-hidden">
        {/* Deep blur for cinematic depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0)_0%,rgba(11,17,32,1)_100%)] pointer-events-none z-0 mix-blend-overlay opacity-30"></div>
        <div className="container mx-auto px-6 text-center max-w-4xl relative z-10 animate-fade-in">
          <h3 className="font-serif text-4xl md:text-5xl text-softwhite/90 mb-16 leading-relaxed font-light italic">
            “UNSAID began with a simple question:<br />
            <span className="text-white font-normal bg-clip-text text-transparent bg-gradient-to-r from-white to-softwhite">What if emotions had a dashboard?</span>”
          </h3>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-softwhite/70 text-xl font-light">
            <span className="hover:text-white transition-colors cursor-default">Clarity over chaos.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-electric shadow-glow-electric animate-pulse-soft hidden md:block"></span>
            <span className="hover:text-white transition-colors cursor-default">Reflection over reaction.</span>
            <span className="w-1.5 h-1.5 rounded-full bg-lavenderglow shadow-glow-lavenderglow animate-pulse-soft hidden md:block" style={{ animationDelay: '0.5s' }}></span>
            <span className="hover:text-white transition-colors cursor-default">Intelligence over impulse.</span>
          </div>

          <div className="mt-24 w-px h-32 bg-gradient-to-b from-electric via-lavenderglow to-transparent mx-auto opacity-50 relative pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-white rounded-full blur-[1px] animate-[ping_3s_infinite]"></div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: TRUST BLOCK (Highlight Section)
          ============================================ */}
      <section className="relative z-10 py-32 bg-[#0B1220]">
        <div className="container mx-auto px-6 flex justify-center">
          <div className="relative w-full max-w-4xl group">
            {/* Soft background spotlight highlight */}
            <div className="absolute -inset-2 bg-gradient-to-r from-electric/20 via-lavenderglow/20 to-electric/20 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-100 transition duration-1000 animate-gradient-shift"></div>

            <div className="relative bg-navy-900/60 backdrop-blur-3xl rounded-[3rem] p-12 md:p-20 border border-white/10 shadow-glass-panel overflow-hidden text-center">
              {/* Subtle animated border gradient */}
              <div className="absolute inset-0 border-2 border-transparent bg-[linear-gradient(45deg,transparent,rgba(59,130,246,0.3),transparent)] bg-[length:300%_300%] animate-gradient-shift rounded-[3rem] pointer-events-none mix-blend-overlay"></div>

              <div className="absolute inset-0 shadow-inner-glass rounded-[3rem] pointer-events-none"></div>

              <div className="w-20 h-20 mx-auto mb-10 rounded-3xl bg-white/5 border border-white/20 flex items-center justify-center shadow-inner-glass relative group-hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-3xl shadow-glow-electric animate-pulse-soft opacity-70"></div>
                <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>

              <h3 className="font-serif text-4xl md:text-5xl text-white mb-12 drop-shadow-md">Your Thoughts Stay Yours.</h3>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
                {["End-to-end encrypted", "No public feeds", "No emotional data selling", "Secure by architecture"].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-softwhite/80 text-lg md:text-xl font-light group/item">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-electric/20 border border-electric/50 flex items-center justify-center text-electric group-hover/item:bg-electric group-hover/item:text-white group-hover/item:shadow-glow-electric transition-all duration-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: WHO IT'S FOR
          ============================================ */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-[#0B1220] to-[#0E1A35] overflow-hidden">
        {/* Gentle background particle movement */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[
            { t: '20%', l: '15%', d: '0s', dur: '4s' }, { t: '80%', l: '25%', d: '1s', dur: '5s' }, { t: '60%', l: '80%', d: '2s', dur: '4.5s' },
            { t: '30%', l: '85%', d: '0.5s', dur: '5.5s' }, { t: '90%', l: '75%', d: '1.5s', dur: '3.5s' }, { t: '40%', l: '45%', d: '2.5s', dur: '6s' },
          ].map((pos, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 bg-lavenderglow rounded-full blur-[1px] animate-float" style={{ top: pos.t, left: pos.l, animationDelay: pos.d, animationDuration: pos.dur }}></div>
          ))}
        </div>

        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-white">Who It's For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
            {[
              { title: "The Overthinker", desc: "Untangle your thoughts in a structured space.", icon: "🌊" },
              { title: "The Deep Feeler", desc: "Understand your emotional patterns over time.", icon: "🌌" },
              { title: "The Quiet Builder", desc: "Process your internal dialogue without distractions.", icon: "🧱" },
            ].map((identity, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 shadow-apple-card hover:shadow-[0_0_40px_rgba(167,139,250,0.2)] hover:border-lavenderglow/30 transition-all duration-500 hover:-translate-y-2 cursor-default text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">{identity.icon}</div>
                <h3 className="font-serif text-2xl text-white mb-3">{identity.title}</h3>
                <p className="text-softwhite/60 font-light">{identity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION
          ============================================ */}
      <section className="relative z-10 py-40 bg-gradient-to-b from-[#0E1A35] to-[#0B1220] border-t border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial-electric opacity-10 blur-[100px] pointer-events-none mix-blend-screen"></div>

        <div className="container mx-auto px-6 text-center animate-fade-in relative z-10">
          <h2 className="font-serif text-4xl md:text-6xl text-softwhite/90 max-w-5xl mx-auto leading-tight mb-16 drop-shadow-md">
            “It’s okay to take up space — even in your own thoughts.”
          </h2>

          <Link
            href="/auth/signup"
            className="inline-block px-14 py-6 bg-gradient-to-r from-electric to-lavenderglow text-white rounded-full font-medium text-xl
                         shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_80px_rgba(167,139,250,0.8)]
                         transform hover:-translate-y-2 hover:scale-[1.03] transition-all duration-500 border border-white/20"
          >
            Start Your Private Space
          </Link>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="relative z-10 border-t border-white/5 bg-midnight pt-12 pb-12 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial-midnight opacity-20 pointer-events-none"></div>

        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-softwhite/40">
            <div className="mb-6 md:mb-0 flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gradient-to-br from-electric to-lavenderglow"></span>
              <span className="font-serif text-xl text-softwhite">UNSAID</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 mb-6 md:mb-0">
              <Link href="#about" className="hover:text-white transition-colors">Our Story</Link>
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/" className="hover:text-white transition-colors">Terms</Link>
            </div>

            <div>
              <p>© {new Date().getFullYear()} UNSAID. System Online.</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
