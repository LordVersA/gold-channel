import { Context } from 'telegraf';
import { Messages } from '../utils/messages';
import { ChannelConfigService } from '../services/ChannelConfigService';
import { AdminService } from '../services/AdminService';

/**
 * Handle /viewpricing command
 * Shows current pricing configuration for the channel
 */
export async function handleViewPricing(ctx: Context): Promise<void> {
  try {
    // Get admin's channel
    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      await ctx.reply(Messages.errorNotAdmin);
      return;
    }

    const channelId = admin.channelId;

    // Get pricing configuration
    const pricing = await ChannelConfigService.getPricingConfig(channelId);

    // Format message
    const message = `${Messages.viewPricingTitle}\n\n${Messages.customerPricing(
      pricing.customer.tax,
      pricing.customer.laborFee,
      pricing.customer.sellingProfit,
      pricing.customer.total
    )}\n\n${Messages.collabPricing(
      pricing.collab.tax,
      pricing.collab.laborFee,
      pricing.collab.sellingProfit,
      pricing.collab.total
    )}`;

    await ctx.reply(message);
  } catch (error) {
    console.error('Error in handleViewPricing:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
