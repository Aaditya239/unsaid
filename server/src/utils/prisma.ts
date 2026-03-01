// ============================================
// Prisma Client Instance
// ============================================
// This module creates a singleton Prisma client instance.
// In development, it prevents multiple instances during hot reload.
// ============================================

import { PrismaClient } from '@prisma/client';

// Extend globalThis to include prisma in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with logging in development
export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

// In development, store the client on globalThis to prevent
// multiple instances during hot module replacement
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
