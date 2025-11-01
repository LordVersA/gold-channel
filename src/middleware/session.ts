import { Middleware } from 'telegraf';
import { BotContext, SessionData } from '../types/context';

/**
 * Simple in-memory session storage
 * For production, consider using a database or Redis
 */

const sessions = new Map<number, SessionData>();

/**
 * Session middleware
 * Provides session storage for multi-step flows
 */
export const sessionMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;

  if (userId) {
    // Get or create session
    if (!sessions.has(userId)) {
      sessions.set(userId, {});
    }
    ctx.session = sessions.get(userId);
  }

  return next();
};

/**
 * Clear session for a user
 */
export function clearSession(userId: number): void {
  sessions.delete(userId);
}

/**
 * Get session for a user
 */
export function getSession(userId: number): SessionData | undefined {
  return sessions.get(userId);
}
