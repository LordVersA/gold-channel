import { BotContext } from '../types/context';
import { TokenService } from '../services/TokenService';
import { AdminService } from '../services/AdminService';
import { getUserIdBigInt, buildDeepLink } from '../utils/telegram';
import { Messages } from '../utils/messages';

/**
 * Handle /addadmin command
 * Admin-only command to generate admin invite links
 */

export async function handleAddAdmin(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  try {
    // Get admin's channel
    const admin = await AdminService.getAdmin(userId);
    if (!admin) {
      await ctx.reply('شما هنوز کانالی تنظیم نکرده‌اید. لطفاً ابتدا از دستور /setchannel استفاده کنید.');
      return;
    }

    // Generate token for this channel
    const token = await TokenService.generateToken('admin', userId, admin.channelId);

    // Get bot username
    const botInfo = await ctx.telegram.getMe();
    const deepLink = buildDeepLink(botInfo.username, `admin-${token}`);

    // Send the link to admin
    await ctx.reply(`لینک دعوت ادمین:\n\n${deepLink}\n\nاین لینک یک‌بار مصرف است و برای ${process.env.INVITE_TOKEN_EXPIRY || 7} روز معتبر است.`);
  } catch (error) {
    console.error('Error generating admin link:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
