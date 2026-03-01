'use client';

// ============================================
// Alert Component - Warm & Friendly Theme
// ============================================

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Alert = ({ variant = 'info', title, children, className }: AlertProps) => {
  const variants = {
    info: {
      container: 'bg-secondary-50 border-secondary-200 text-secondary-700',
      icon: <Info className="h-5 w-5 text-secondary-500" />,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-700',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-700',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
  };

  const config = variants[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border-2 p-4',
        config.container,
        className
      )}
      role="alert"
    >
      <span className="flex-shrink-0">{config.icon}</span>
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
