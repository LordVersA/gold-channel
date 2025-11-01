import cron from 'node-cron';
import { GoldSetService } from './GoldSetService';
import { AdminService } from './AdminService';
import { buildChannelPostLink } from '../utils/telegram';
import { Messages } from '../utils/messages';
import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context';

/**
 * Analytics Service
 * Handles daily analytics reports via cron job
 */

export class AnalyticsService {
  private bot: Telegraf<BotContext>;

  constructor(bot: Telegraf<BotContext>) {
    this.bot = bot;
  }

  /**
   * Start the daily analytics cron job
   * Runs at 00:00 Europe/Zurich time
   */
  startDailyReport() {
    // Run at midnight Europe/Zurich (00:00)
    // Note: node-cron uses server time, so adjust if server is in different timezone
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily analytics report...');
      await this.generateAndSendReport();
    }, {
      timezone: 'Asia/Tehran',
    });

    console.log('Daily analytics cron job started (+03:30 Asia/Tehran)');
  }

  /**
   * Generate and send daily analytics report to all admins
   */
  async generateAndSendReport() {
    try {
      // Calculate date range (previous 24 hours)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      // Get all unique channels from admins
      const allAdmins = await AdminService.getAdmins(''); // Get all admins
      const channelIds = [...new Set(allAdmins.map(admin => admin.channelId))];

      for (const channelId of channelIds) {
        // Get top viewed sets for this channel
        const topSets = await GoldSetService.getTopViewedSets(channelId, startDate, endDate, 10);

        if (topSets.length === 0) {
          continue; // Skip if no views
        }

        // Format report
        const report = this.formatReport(startDate, topSets);

        // Send to all admins of this channel
        const admins = await AdminService.getAdmins(channelId);
        for (const admin of admins) {
          try {
            await this.bot.telegram.sendMessage(admin.userId.toString(), report, {
              parse_mode: 'HTML',
              link_preview_options: { is_disabled: true },
            });
          } catch (error) {
            console.error(`Error sending report to admin ${admin.userId}:`, error);
          }
        }
      }

      console.log('Daily analytics report sent successfully');
    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  }

  /**
   * Format analytics report
   */
  private formatReport(date: Date, topSets: Array<{
    goldSetId: number;
    caption: string;
    viewCount: number;
    channelMessageId: number;
    channelId: string;
  }>): string {
    const dateStr = date.toLocaleDateString('fa-IR');

    let report = `${Messages.dailyReportTitle}\n`;
    report += `${Messages.dailyReportDate(dateStr)}\n\n`;
    report += `${Messages.topViewedSets}\n\n`;

    topSets.forEach((set, index) => {
      const link = buildChannelPostLink(set.channelId, set.channelMessageId);
      const caption = set.caption.substring(0, 50) + (set.caption.length > 50 ? '...' : '');
      report += `${index + 1}. ${Messages.viewCount(caption, set.viewCount, link)}\n\n`;
    });

    return report;
  }
}
