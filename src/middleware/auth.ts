import { Middleware } from 'telegraf';
import { BotContext } from '../types/context';
import { AdminService } from '../services/AdminService';
import { CollaboratorService } from '../services/CollaboratorService';
import { getUserIdBigInt } from '../utils/telegram';
import { Messages } from '../utils/messages';

/**
 * Authentication middleware
 * Checks if user is admin and/or collaborator and attaches info to context
 */

export const authMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const userId = getUserIdBigInt(ctx);

  if (userId) {
    // Check if user is admin
    ctx.isAdmin = await AdminService.isAdmin(userId);

    // Check if user is collaborator
    ctx.isCollaborator = await CollaboratorService.isCollaborator(userId);
  }

  return next();
};

/**
 * Middleware to require admin access
 * Use this for admin-only commands
 */
export const requireAdmin: Middleware<BotContext> = async (ctx, next) => {
  if (!ctx.isAdmin) {
    await ctx.reply(Messages.errorNotAdmin);
    return;
  }
  return next();
};
