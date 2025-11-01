import { Telegraf } from 'telegraf';
import { BotContext } from './types/context';
import { config } from './config/config';
import { authMiddleware, requireAdmin } from './middleware/auth';
import { sessionMiddleware } from './middleware/session';

// Command handlers
import { handleStart } from './handlers/start';
import { handleSetChannel, handleChannelForward } from './handlers/setchannel';
import { handleHamkar } from './handlers/hamkar';
import { handleListHamkar } from './handlers/listhamkar';
import { handleAddAdmin } from './handlers/addadmin';
import { handleHelp } from './handlers/help';
import { handlePhoto, handleTextInput } from './handlers/album';
import { handleCallbackQuery } from './handlers/callbacks';
import { handlePmHamkar, handleBroadcastMessage } from './handlers/pmhamkar';
import { handleAmar } from './handlers/amar';
import { handleSetTax } from './handlers/settax';
import { handleSetFee } from './handlers/setfee';
import { handleSetProfit } from './handlers/setprofit';
import { handleViewPricing } from './handlers/viewpricing';

// Services
import { AnalyticsService } from './services/AnalyticsService';

/**
 * Main bot initialization and setup
 */

// Create bot instance
const bot = new Telegraf<BotContext>(config.botToken);

// Error handling middleware
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('خطایی رخ داد. لطفاً دوباره تلاش کنید.').catch(console.error);
});

// Apply middleware
bot.use(sessionMiddleware);
bot.use(authMiddleware);

// Command handlers
bot.command('start', handleStart);
bot.command('setchannel', handleSetChannel);
bot.command('hamkar', requireAdmin, handleHamkar);
bot.command('listhamkar', requireAdmin, handleListHamkar);
bot.command('addadmin', requireAdmin, handleAddAdmin);
bot.command('pmhamkar', requireAdmin, handlePmHamkar);
bot.command('amar', requireAdmin, handleAmar);
bot.command('settax', requireAdmin, handleSetTax);
bot.command('setfee', requireAdmin, handleSetFee);
bot.command('setprofit', requireAdmin, handleSetProfit);
bot.command('viewpricing', requireAdmin, handleViewPricing);
bot.command('help', requireAdmin, handleHelp);

// Handle forwarded messages for channel setup
bot.on('message', async (ctx, next) => {
  if (ctx.message && 'forward_from_chat' in ctx.message) {
    await handleChannelForward(ctx);
    return;
  }
  return next();
});

// Handle photos for album creation or broadcast
bot.on('photo', async (ctx) => {
  // Check if we're awaiting broadcast message
  if (ctx.session?.awaitingBroadcastMessage) {
    await handleBroadcastMessage(ctx);
    return;
  }
  // Otherwise, handle as album photo
  await handlePhoto(ctx);
});

// Handle text messages for caption, weight input, or broadcast message
bot.on('text', async (ctx, next) => {
  // Check if we're awaiting caption or weight
  if (ctx.session?.awaitingCaption || ctx.session?.awaitingWeight) {
    await handleTextInput(ctx);
    return;
  }
  // Check if we're awaiting broadcast message
  if (ctx.session?.awaitingBroadcastMessage) {
    await handleBroadcastMessage(ctx);
    return;
  }
  return next();
});

// Handle callback queries (inline button clicks)
bot.on('callback_query', handleCallbackQuery);

// Initialize analytics service
const analyticsService = new AnalyticsService(bot);
analyticsService.startDailyReport();

// Launch bot
async function startBot() {
  try {
    console.log('Starting Telegram Gold Set Bot...');

    // Validate configuration
    if (!config.botToken) {
      throw new Error('BOT_TOKEN is not set in environment variables');
    }

    // Start bot
    bot.launch();

    console.log('Bot is running!');
    console.log(`Bot Token: ${config.botToken.substring(0, 10)}...`);
    console.log(`Database: ${config.databaseUrl}`);
    console.log(`Price Cache TTL: ${config.priceCacheTtl}s`);
    console.log(`Timezone: ${config.timezone}`);

    // Get bot info
    const botInfo = await bot.telegram.getMe();
    console.log(`Bot username: @${botInfo.username}`);
    console.log(`Bot name: ${botInfo.first_name}`);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('Received SIGINT, stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('Received SIGTERM, stopping bot...');
  bot.stop('SIGTERM');
});

// Start the bot
startBot();
