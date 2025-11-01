import { BotContext } from '../types/context';
import { TokenService } from '../services/TokenService';
import { getUserIdBigInt, buildDeepLink } from '../utils/telegram';
import { Messages } from '../utils/messages';

/**
 * Handle /hamkar command
 * Admin-only command to generate collaborator invite links
 */

export async function handleHamkar(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  try {
    // Generate token
    const token = await TokenService.generateToken('collab', userId);

    // Get bot username
    const botInfo = await ctx.telegram.getMe();
    const deepLink = buildDeepLink(botInfo.username, `collab-${token}`);

    // Send the link to admin
    await ctx.reply(`لینک دعوت همکار:\n\n${deepLink}\n\nاین لینک برای ${process.env.INVITE_TOKEN_EXPIRY || 7} روز معتبر است.`);
  } catch (error) {
    console.error('Error generating collaborator link:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
