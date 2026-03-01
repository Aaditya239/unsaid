// ============================================
// PIN Lock Store (Zustand)
// ============================================
// Manages PIN lock screen state.
// This is a frontend-only feature for privacy.
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

interface PinLockState {
  isLocked: boolean;
  isEnabled: boolean;
  pin: string; // In production, this should be hashed/encrypted
  lastUnlockTime: number;
  failedAttempts: number;
  lockoutUntil: number | null;
}

interface PinLockActions {
  lock: () => void;
  unlock: (enteredPin: string) => boolean;
  setPin: (newPin: string) => void;
  enablePinLock: () => void;
  disablePinLock: () => void;
  resetFailedAttempts: () => void;
}

type PinLockStore = PinLockState & PinLockActions;

// ============================================
// CONSTANTS
// ============================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================
// STORE
// ============================================

export const usePinLockStore = create<PinLockStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isLocked: false,
      isEnabled: false,
      pin: '1234', // Default PIN - user should change this
      lastUnlockTime: Date.now(),
      failedAttempts: 0,
      lockoutUntil: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Lock the screen
       */
      lock: () => {
        if (get().isEnabled) {
          set({ isLocked: true });
        }
      },

      /**
       * Attempt to unlock with PIN
       * Returns true if successful, false otherwise
       */
      unlock: (enteredPin: string) => {
        const state = get();

        // Check if in lockout period
        if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
          return false;
        }

        // Reset lockout if expired
        if (state.lockoutUntil && Date.now() >= state.lockoutUntil) {
          set({ lockoutUntil: null, failedAttempts: 0 });
        }

        // Check PIN
        if (enteredPin === state.pin) {
          set({
            isLocked: false,
            lastUnlockTime: Date.now(),
            failedAttempts: 0,
            lockoutUntil: null,
          });
          return true;
        }

        // Wrong PIN - increment failed attempts
        const newFailedAttempts = state.failedAttempts + 1;
        
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Lockout user
          set({
            failedAttempts: newFailedAttempts,
            lockoutUntil: Date.now() + LOCKOUT_DURATION,
          });
        } else {
          set({ failedAttempts: newFailedAttempts });
        }

        return false;
      },

      /**
       * Set a new PIN
       */
      setPin: (newPin: string) => {
        if (newPin.length === 4 && /^\d+$/.test(newPin)) {
          set({ pin: newPin });
        }
      },

      /**
       * Enable PIN lock feature
       */
      enablePinLock: () => set({ isEnabled: true }),

      /**
       * Disable PIN lock feature
       */
      disablePinLock: () => set({ isEnabled: false, isLocked: false }),

      /**
       * Reset failed attempts
       */
      resetFailedAttempts: () => set({ failedAttempts: 0, lockoutUntil: null }),
    }),
    {
      name: 'unsaid-pin-lock',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        pin: state.pin, // Note: In production, encrypt this!
        lastUnlockTime: state.lastUnlockTime,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectIsLocked = (state: PinLockStore) => state.isLocked;
export const selectIsEnabled = (state: PinLockStore) => state.isEnabled;
export const selectFailedAttempts = (state: PinLockStore) => state.failedAttempts;
export const selectLockoutUntil = (state: PinLockStore) => state.lockoutUntil;
