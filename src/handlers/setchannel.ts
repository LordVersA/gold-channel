import { BotContext } from '../types/context';
import { AdminService } from '../services/AdminService';
import { getUserIdBigInt, extractChannelId, isChannelMessage } from '../utils/telegram';
import { Messages } from '../utils/messages';

/**
 * Handle /setchannel command
 * Admin-only command to configure the target channel
 */

export async function handleSetChannel(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  // Send instructions
  await ctx.reply(Messages.setChannelInstructions);

  // Mark session as awaiting channel forward
  if (ctx.session) {
    ctx.session.awaitingChannelForward = true;
  }
}

/**
 * Handle forwarded message for channel setup
 */
export async function handleChannelForward(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    return;
  }

  // Check if we're awaiting a channel forward
  if (!ctx.session?.awaitingChannelForward) {
    return;
  }

  // Check if message is forwarded from a channel
  if (!isChannelMessage(ctx)) {
    await ctx.reply(Messages.setChannelInstructions);
    return;
  }

  // Extract channel ID
  const channelId = extractChannelId(ctx);
  if (!channelId) {
    await ctx.reply(Messages.channelSetError);
    return;
  }

  try {
    // Verify bot is admin in the channel
    const botMember = await ctx.telegram.getChatMember(channelId, ctx.botInfo.id);
    if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
      await ctx.reply(Messages.channelSetError);
      return;
    }

    // Register user as admin for this channel
    const username = ctx.from?.username;
    await AdminService.addAdmin(userId, channelId, username);

    // Clear session state
    if (ctx.session) {
      ctx.session.awaitingChannelForward = false;
      ctx.session.channelId = channelId;
    }

    await ctx.reply(Messages.channelSet);
  } catch (error) {
    console.error('Error setting channel:', error);
    await ctx.reply(Messages.channelSetError);
  }
}
