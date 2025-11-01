import { BotContext } from '../types/context';
import { TokenService } from '../services/TokenService';
import { AdminService } from '../services/AdminService';
import { CollaboratorService } from '../services/CollaboratorService';
import { getUserIdBigInt } from '../utils/telegram';
import { Messages } from '../utils/messages';

/**
 * Handle /start command
 * Supports deep links for collaborator and admin registration
 */

export async function handleStart(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  // Check for deep link parameter
  const startParam = ctx.message && 'text' in ctx.message
    ? ctx.message.text.split(' ')[1]
    : undefined;

  if (startParam) {
    // Parse deep link: collab-<token> or admin-<token>
    if (startParam.startsWith('collab-')) {
      const token = startParam.substring(7);
      await handleCollaboratorRegistration(ctx, userId, token);
      return;
    } else if (startParam.startsWith('admin-')) {
      const token = startParam.substring(6);
      await handleAdminRegistration(ctx, userId, token);
      return;
    }
  }

  // Regular start command
  if (ctx.isAdmin) {
    await ctx.reply(Messages.welcomeAdmin);
  } else if (ctx.isCollaborator) {
    await ctx.reply(Messages.welcomeCollaborator);
  } else {
    await ctx.reply(Messages.welcome);
  }
}

/**
 * Handle collaborator registration via deep link
 */
async function handleCollaboratorRegistration(
  ctx: BotContext,
  userId: bigint,
  token: string
) {
  // Check if already a collaborator
  if (ctx.isCollaborator) {
    await ctx.reply(Messages.alreadyCollaborator);
    return;
  }

  // Validate token
  const validation = await TokenService.validateToken(token);

  if (!validation.valid) {
    await ctx.reply(Messages.tokenInvalid);
    return;
  }

  if (validation.type !== 'collab') {
    await ctx.reply(Messages.tokenInvalid);
    return;
  }

  // Register as collaborator
  const username = ctx.from?.username;
  await CollaboratorService.addCollaborator(userId, username);

  // Mark token as used
  await TokenService.consumeToken(token);

  await ctx.reply(Messages.collaboratorRegistered);
}

/**
 * Handle admin registration via deep link
 */
async function handleAdminRegistration(
  ctx: BotContext,
  userId: bigint,
  token: string
) {
  // Validate token
  const validation = await TokenService.validateToken(token);

  if (!validation.valid) {
    await ctx.reply(Messages.tokenInvalid);
    return;
  }

  if (validation.type !== 'admin' || !validation.channelId) {
    await ctx.reply(Messages.tokenInvalid);
    return;
  }

  // Check if already admin for this channel
  const isAdmin = await AdminService.isAdmin(userId, validation.channelId);
  if (isAdmin) {
    await ctx.reply(Messages.alreadyAdmin);
    return;
  }

  // Register as admin
  const username = ctx.from?.username;
  await AdminService.addAdmin(userId, validation.channelId, username);

  // Mark token as used
  await TokenService.consumeToken(token);

  await ctx.reply(Messages.adminRegistered);

  // Also register as collaborator if not already
  if (!ctx.isCollaborator) {
    await CollaboratorService.addCollaborator(userId, username);
  }
}
