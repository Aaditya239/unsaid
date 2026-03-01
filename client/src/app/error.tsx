'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-blush-300 rounded-full blur-[100px] opacity-30 animate-float-slow" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-rose-400 rounded-full blur-[100px] opacity-20 animate-float-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative glass-card p-12 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blush-200 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-coffee-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="font-serif text-3xl text-coffee-300 mb-3">
          Something went wrong
        </h1>
        
        <p className="text-coffee-300/70 mb-8">
          Don&apos;t worry, your thoughts are safe. Let&apos;s try that again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-8 py-3 bg-coffee-300 text-cream-50 rounded-full font-medium shadow-soft hover:shadow-soft-lg hover:bg-coffee-400 transform hover:-translate-y-0.5 transition-all duration-300"
          >
            Try again
          </button>
          
          <Link href="/" className="px-8 py-3 bg-transparent text-coffee-300 rounded-full font-medium border-2 border-blush-300 hover:border-rose-400 hover:bg-white/30 transition-all duration-300">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
