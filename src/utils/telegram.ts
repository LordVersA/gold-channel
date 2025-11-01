import { Context } from 'telegraf';

/**
 * Telegram helper utilities
 */

/**
 * Check if a message is from a channel
 */
export function isChannelMessage(ctx: Context): boolean {
  if (!ctx.message || !('forward_from_chat' in ctx.message)) {
    return false;
  }
  const forwardedFrom = ctx.message.forward_from_chat;
  if (!forwardedFrom || typeof forwardedFrom !== 'object') {
    return false;
  }
  return 'type' in forwardedFrom && forwardedFrom.type === 'channel';
}

/**
 * Extract channel ID from a forwarded message
 */
export function extractChannelId(ctx: Context): string | null {
  if (!ctx.message || !('forward_from_chat' in ctx.message)) {
    return null;
  }
  const forwardedFrom = ctx.message.forward_from_chat;
  if (!forwardedFrom || typeof forwardedFrom !== 'object') {
    return null;
  }
  if ('type' in forwardedFrom && forwardedFrom.type === 'channel' && 'id' in forwardedFrom) {
    return String(forwardedFrom.id);
  }
  return null;
}

/**
 * Build a deep link for bot start parameters
 */
export function buildDeepLink(botUsername: string, startParam: string): string {
  return `https://t.me/${botUsername}?start=${startParam}`;
}

/**
 * Build a link to a channel post
 */
export function buildChannelPostLink(channelId: string, messageId: number): string {
  // Remove the -100 prefix if it exists (Telegram adds this for supergroups/channels)
  const cleanChannelId = channelId.startsWith('-100')
    ? channelId.substring(4)
    : channelId.replace('-', '');
  return `https://t.me/c/${cleanChannelId}/${messageId}`;
}

/**
 * Get user ID from context
 */
export function getUserId(ctx: Context): number | undefined {
  return ctx.from?.id;
}

/**
 * Get user ID as BigInt for database
 */
export function getUserIdBigInt(ctx: Context): bigint | null {
  const userId = getUserId(ctx);
  return userId ? BigInt(userId) : null;
}
