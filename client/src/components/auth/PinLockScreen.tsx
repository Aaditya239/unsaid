'use client';

// ============================================
// PIN Lock Screen Component - Premium Dark Theme
// ============================================

import { useState, useEffect, useRef } from 'react';
import { usePinLockStore } from '@/stores/pinLockStore';
import { useAuthStore } from '@/stores/authStore';
import { Lock, Delete, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIN_LENGTH = 4;

export default function PinLockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  
  const { unlock, failedAttempts, lockoutUntil } = usePinLockStore();
  const { logout, user } = useAuthStore();
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate remaining lockout time
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setLockoutRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleUnlock = () => {
    if (lockoutRemaining > 0) {
      setError(`Too many attempts. Try again in ${Math.ceil(lockoutRemaining / 1000)}s`);
      return;
    }

    const success = unlock(pin);
    
    if (!success) {
      setError('Incorrect PIN');
      setIsShaking(true);
      setPin('');
      
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < PIN_LENGTH && lockoutRemaining === 0) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/auth/login';
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.ceil((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-dark-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      
      {/* Lock Icon */}
      <div className="relative z-10 mb-8">
        <div className="w-20 h-20 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
          <Lock className="w-10 h-10 text-accent-400" />
        </div>
      </div>

      {/* Title */}
      <h1 className="relative z-10 text-2xl font-bold text-white mb-2">UNSAID Locked</h1>
      <p className="relative z-10 text-zinc-400 mb-8">
        {user?.email ? `Signed in as ${user.email}` : 'Enter PIN to unlock'}
      </p>

      {/* PIN Dots */}
      <div
        className={cn(
          'relative z-10 flex gap-4 mb-8',
          isShaking && 'animate-[shake_0.5s_ease-in-out]'
        )}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all',
              pin.length > i
                ? 'bg-accent-500 border-accent-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                : 'border-zinc-600'
            )}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="relative z-10 text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* Lockout Warning */}
      {lockoutRemaining > 0 && (
        <p className="relative z-10 text-yellow-400 text-sm mb-4">
          Too many attempts. Try again in {formatTime(lockoutRemaining)}
        </p>
      )}

      {/* Failed Attempts Warning */}
      {failedAttempts > 0 && failedAttempts < 5 && lockoutRemaining === 0 && (
        <p className="relative z-10 text-zinc-500 text-xs mb-4">
          {5 - failedAttempts} attempts remaining
        </p>
      )}

      {/* Hidden input for keyboard support */}
      <input
        ref={inputRef}
        type="password"
        value={pin}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
          setPin(value);
          setError('');
        }}
        className="sr-only"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
      />

      {/* Number Pad */}
      <div className="relative z-10 grid grid-cols-3 gap-4 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={lockoutRemaining > 0}
            className={cn(
              'h-16 rounded-full text-2xl font-semibold transition-all',
              'bg-dark-800/80 border border-dark-700 text-white hover:bg-dark-700 hover:border-dark-600 active:scale-95',
              'focus:outline-none focus:border-accent-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {num}
          </button>
        ))}
        
        {/* Empty / Logout */}
        <button
          onClick={handleLogout}
          className="h-16 rounded-full text-zinc-500 hover:text-white hover:bg-dark-800/80 transition-all flex items-center justify-center"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
        
        {/* 0 */}
        <button
          onClick={() => handleNumberClick('0')}
          disabled={lockoutRemaining > 0}
          className={cn(
            'h-16 rounded-full text-2xl font-semibold transition-all',
            'bg-dark-800/80 border border-dark-700 text-white hover:bg-dark-700 hover:border-dark-600 active:scale-95',
            'focus:outline-none focus:border-accent-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          0
        </button>
        
        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={pin.length === 0}
          className={cn(
            'h-16 rounded-full text-zinc-500 hover:text-white hover:bg-dark-800/80 transition-all',
            'flex items-center justify-center',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Style for shake animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
