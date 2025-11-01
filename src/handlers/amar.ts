import { BotContext } from '../types/context';
import { GoldSetService } from '../services/GoldSetService';
import { AdminService } from '../services/AdminService';
import { buildChannelPostLink } from '../utils/telegram';
import { Messages } from '../utils/messages';
import { toPersianNumber } from '../utils/formatters';

/**
 * Handle /amar command
 * Show statistics for top viewed sets (day, week, month)
 */

export async function handleAmar(ctx: BotContext) {
  try {
    // Check if user is admin
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply(Messages.errorGeneric);
      return;
    }

    // Get user's admin record to find their channel
    const admin = await AdminService.getAdmin(BigInt(userId));
    if (!admin) {
      await ctx.reply(Messages.errorNotAdmin);
      return;
    }

    const channelId = admin.channelId;

    // Calculate date ranges
    const now = new Date();

    // Last 24 hours (day)
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Last 7 days (week)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Last 30 days (month)
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get top viewed sets for each period
    const [dayTop, weekTop, monthTop] = await Promise.all([
      GoldSetService.getTopViewedSets(channelId, dayStart, now, 10),
      GoldSetService.getTopViewedSets(channelId, weekStart, now, 10),
      GoldSetService.getTopViewedSets(channelId, monthStart, now, 10),
    ]);

    // Format the report
    let report = `${Messages.statsReportTitle}\n\n`;

    // Daily stats
    report += `${Messages.statsDayTitle}\n`;
    if (dayTop.length === 0) {
      report += `${Messages.noViews}\n\n`;
    } else {
      dayTop.forEach((set, index) => {
        const link = buildChannelPostLink(set.channelId, set.channelMessageId);
        report += `${toPersianNumber(index + 1)}. ${toPersianNumber(set.viewCount)} بازدید (${toPersianNumber(set.uniqueUserCount)} نفر)\n🔗 ${link}\n\n`;
      });
    }

    // Weekly stats
    report += `${Messages.statsWeekTitle}\n`;
    if (weekTop.length === 0) {
      report += `${Messages.noViews}\n\n`;
    } else {
      weekTop.forEach((set, index) => {
        const link = buildChannelPostLink(set.channelId, set.channelMessageId);
        report += `${toPersianNumber(index + 1)}. ${toPersianNumber(set.viewCount)} بازدید (${toPersianNumber(set.uniqueUserCount)} نفر)\n🔗 ${link}\n\n`;
      });
    }

    // Monthly stats
    report += `${Messages.statsMonthTitle}\n`;
    if (monthTop.length === 0) {
      report += `${Messages.noViews}\n\n`;
    } else {
      monthTop.forEach((set, index) => {
        const link = buildChannelPostLink(set.channelId, set.channelMessageId);
        report += `${toPersianNumber(index + 1)}. ${toPersianNumber(set.viewCount)} بازدید (${toPersianNumber(set.uniqueUserCount)} نفر)\n🔗 ${link}\n\n`;
      });
    }

    await ctx.reply(report, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Error generating statistics:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
