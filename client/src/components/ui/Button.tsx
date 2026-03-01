'use client';

// ============================================
// Button Component - Warm & Friendly Theme
// ============================================

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2 font-semibold',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-400',
      'focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ];

    const variants = {
      primary: [
        'text-white rounded-2xl',
        'bg-gradient-to-r from-coffee-500 to-coffee-600',
        'shadow-soft',
        'hover:from-coffee-400 hover:to-coffee-500',
        'hover:shadow-soft-lg',
        'hover:-translate-y-0.5',
        'active:translate-y-0',
      ],
      secondary: [
        'text-white rounded-2xl',
        'bg-gradient-to-r from-rose-500 to-rose-600',
        'shadow-soft',
        'hover:from-rose-400 hover:to-rose-500',
        'hover:shadow-soft-lg',
        'hover:-translate-y-0.5',
      ],
      outline: [
        'text-warm-700 rounded-2xl',
        'bg-transparent',
        'border-2 border-warm-300',
        'hover:bg-warm-100',
        'hover:border-warm-400',
      ],
      ghost: [
        'text-warm-600 rounded-xl',
        'bg-transparent',
        'hover:bg-warm-100',
        'hover:text-warm-900',
      ],
      soft: [
        'text-coffee-600 rounded-2xl',
        'bg-coffee-50',
        'hover:bg-coffee-100',
      ],
      danger: [
        'text-white rounded-2xl',
        'bg-gradient-to-r from-red-500 to-red-600',
        'shadow-[0_4px_14px_rgba(239,68,68,0.35)]',
        'hover:from-red-400 hover:to-red-500',
      ],
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-sm',
      lg: 'h-14 px-8 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
