import { BotContext } from '../types/context';
import { Messages } from '../utils/messages';

/**
 * Handle /help command
 * Show usage guide
 */

export async function handleHelp(ctx: BotContext) {
  await ctx.reply(Messages.help);
}
