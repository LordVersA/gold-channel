import { Context } from 'telegraf';
import { Messages } from '../utils/messages';
import { ChannelConfigService } from '../services/ChannelConfigService';
import { AdminService } from '../services/AdminService';

/**
 * Handle /setprofit command
 * Allows admin to set selling profit percentage for customer or collab pricing
 * Usage: /setprofit <customer|collab> <percentage>
 */
export async function handleSetProfit(ctx: Context): Promise<void> {
  try {
    // Get admin's channel
    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      await ctx.reply(Messages.errorNotAdmin);
      return;
    }

    const channelId = admin.channelId;

    // Parse command arguments
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const args = text.split(' ').slice(1); // Remove command itself

    if (args.length !== 2) {
      await ctx.reply(Messages.setProfitUsage);
      return;
    }

    const [type, percentageStr] = args;

    // Validate type
    if (type !== 'customer' && type !== 'collab') {
      await ctx.reply(Messages.invalidPricingType);
      return;
    }

    // Validate percentage
    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      await ctx.reply(Messages.invalidPercentage);
      return;
    }

    // Update configuration
    if (type === 'customer') {
      await ChannelConfigService.updateCustomerSellingProfit(channelId, percentage);
    } else {
      await ChannelConfigService.updateCollabSellingProfit(channelId, percentage);
    }

    await ctx.reply(Messages.profitUpdated(type, percentage));
  } catch (error) {
    console.error('Error in handleSetProfit:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
