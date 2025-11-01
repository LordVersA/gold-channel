import { Context as TelegrafContext } from 'telegraf';

/**
 * Extended context types for the bot
 */

export interface SessionData {
  // Album creation state (single image)
  albumPhoto?: string; // Single photo file_id
  albumWeight?: number;
  albumCaption?: string;
  draftId?: string;
  channelId?: string;

  // Multi-step flow state
  awaitingWeight?: boolean;
  awaitingChannelForward?: boolean;
  awaitingCaption?: boolean; // Waiting for caption after image

  // Broadcast state
  awaitingBroadcastMessage?: boolean;
  broadcastMessageId?: number;
  broadcastChatId?: number;
  broadcastControlMessageId?: number;

  // Preview message IDs for cleanup
  previewMessageId?: number;
  controlMessageId?: number;
}

export interface BotContext extends TelegrafContext {
  session?: SessionData;
  isAdmin?: boolean;
  isCollaborator?: boolean;
}
