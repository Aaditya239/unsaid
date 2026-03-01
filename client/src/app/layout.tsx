import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { PinLockProvider } from '@/components/providers/PinLockProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { EmotionalProvider } from '@/components/providers/EmotionalProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UNSAID - Secure Communication',
  description: 'A secure platform for private communication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Auth Provider wraps entire app for authentication state */}
        <AuthProvider>
          {/* Theme Provider applies global CSS variables */}
          <ThemeProvider>
            {/* Emotional Provider initializes unified emotional state */}
            <EmotionalProvider>
              {/* PIN Lock Provider adds lock screen functionality */}
              <PinLockProvider>
                {children}
              </PinLockProvider>
            </EmotionalProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

