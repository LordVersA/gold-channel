import { BotContext } from '../types/context';
import { Messages } from '../utils/messages';
import { AdminService } from '../services/AdminService';

/**
 * Handle /help command
 * Show usage guide (admin only)
 */

export async function handleHelp(ctx: BotContext): Promise<void> {
  try {
    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      return; // Silently ignore non-admin users
    }

    await ctx.reply(Messages.help);
  } catch (error) {
    console.error('Error in handleHelp:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
