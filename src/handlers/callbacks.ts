import { BotContext } from '../types/context';
import { GoldPriceService } from '../services/GoldPriceService';
import { GoldSetService } from '../services/GoldSetService';
import { PriceCalculator } from '../services/PriceCalculator';
import { AdminService } from '../services/AdminService';
import { getUserIdBigInt } from '../utils/telegram';
import { formatDateTime, formatCurrency, formatWeight } from '../utils/formatters';
import { Messages } from '../utils/messages';
import { Markup } from 'telegraf';
import { clearSession } from '../middleware/session';
import { handleBroadcastSubmit, handleBroadcastCancel } from './pmhamkar';

/**
 * Handle callback queries from inline buttons
 */

/**
 * Handle "Price Now" button in preview
 */
export async function handlePreviewPrice(ctx: BotContext, draftId: string) {
  const session = ctx.session;
  if (!session || session.draftId !== draftId || !session.albumWeight) {
    await ctx.answerCbQuery('پیش‌نمایش منقضی شده است.');
    return;
  }

  try {
    // Get spot price
    const spotPrice = await GoldPriceService.getCachedPrice();

    // Calculate prices
    const normalPrice = PriceCalculator.calculateNormalPrice(session.albumWeight, spotPrice);
    const collabPrice = PriceCalculator.calculateCollaboratorPrice(session.albumWeight, spotPrice);

    // Check if user is collaborator
    const isCollab = ctx.isCollaborator || false;

    // Format popup message
    const message = Messages.pricePopup(
      formatDateTime(new Date()),
      formatWeight(session.albumWeight),
      formatCurrency(spotPrice),
      formatCurrency(spotPrice),
      formatCurrency(normalPrice),
      isCollab,
      isCollab ? formatCurrency(collabPrice) : undefined
    );

    await ctx.answerCbQuery(message, { show_alert: true });
  } catch (error) {
    console.error('Error calculating preview price:', error);
    await ctx.answerCbQuery(Messages.errorPriceFetch, { show_alert: true });
  }
}

/**
 * Handle "Finalize" button - publish to channel
 */
export async function handleFinalize(ctx: BotContext, draftId: string) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.answerCbQuery(Messages.errorGeneric);
    return;
  }

  const session = ctx.session;
  if (!session || session.draftId !== draftId || !session.albumPhoto || !session.albumWeight) {
    await ctx.answerCbQuery('پیش‌نمایش منقضی شده است.');
    return;
  }

  // Get admin's channel
  const admin = await AdminService.getAdmin(userId);
  if (!admin) {
    await ctx.answerCbQuery('کانال تنظیم نشده است.');
    return;
  }

  try {
    // Send photo to channel with inline button (without emoji in caption)
    const sentMessage = await ctx.telegram.sendPhoto(
      admin.channelId,
      session.albumPhoto,
      {
        caption: session.albumCaption || '',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(Messages.channelPriceNow, `channel_price:temp`)],
        ]),
      }
    );

    // Save gold set to database
    const goldSet = await GoldSetService.saveGoldSet({
      channelMessageId: sentMessage.message_id,
      weight: session.albumWeight,
      caption: session.albumCaption || '',
      channelId: admin.channelId,
    });

    // Update button with correct gold set ID
    await ctx.telegram.editMessageReplyMarkup(
      admin.channelId,
      sentMessage.message_id,
      undefined,
      Markup.inlineKeyboard([
        [Markup.button.callback(Messages.channelPriceNow, `channel_price:${goldSet.id}`)],
      ]).reply_markup
    );

    // Delete the control message (Finalize/Cancel buttons) from private chat
    if (session.controlMessageId && ctx.chat?.id) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, session.controlMessageId);
      } catch (error) {
        console.error('Failed to delete control message:', error);
      }
    }

    // Clear session
    if (ctx.from?.id) {
      clearSession(ctx.from.id);
    }

    await ctx.answerCbQuery(Messages.draftFinalized);
  } catch (error) {
    console.error('Error finalizing album:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}

/**
 * Handle "Cancel" button - discard draft
 */
export async function handleCancel(ctx: BotContext, draftId: string) {
  const session = ctx.session;
  if (!session || session.draftId !== draftId) {
    await ctx.answerCbQuery('عملیات منقضی شده است.');
    return;
  }

  // Clear session
  if (ctx.from?.id) {
    clearSession(ctx.from.id);
  }

  await ctx.answerCbQuery(Messages.actionCancelled);
  await ctx.reply(Messages.actionCancelled);
}

/**
 * Handle "Price Now" button in channel
 */
export async function handleChannelPrice(ctx: BotContext, goldSetId: string) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.answerCbQuery(Messages.errorGeneric);
    return;
  }

  try {
    // Get gold set
    const goldSet = await GoldSetService.getGoldSet(parseInt(goldSetId));
    if (!goldSet) {
      await ctx.answerCbQuery('ست طلا یافت نشد.');
      return;
    }

    // Get spot price
    const spotPrice = await GoldPriceService.getCachedPrice();

    // Calculate normal price
    const normalPrice = PriceCalculator.calculateNormalPrice(goldSet.weight, spotPrice);

    // Check if user is collaborator
    const isCollab = ctx.isCollaborator || false;
    let collabPrice: number | undefined;
    if (isCollab) {
      collabPrice = PriceCalculator.calculateCollaboratorPrice(goldSet.weight, spotPrice);
    }

    // Log price check
    await GoldSetService.logPriceCheck(userId, goldSet.id);

    // Format popup message
    const message = Messages.pricePopup(
      formatDateTime(new Date()),
      formatWeight(goldSet.weight),
      formatCurrency(spotPrice),
      formatCurrency(spotPrice),
      formatCurrency(normalPrice),
      isCollab,
      isCollab ? formatCurrency(collabPrice!) : undefined
    );

    await ctx.answerCbQuery(message, { show_alert: true });
  } catch (error) {
    console.error('Error calculating channel price:', error);
    await ctx.answerCbQuery(Messages.errorPriceFetch, { show_alert: true });
  }
}

/**
 * Main callback query router
 */
export async function handleCallbackQuery(ctx: BotContext) {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    return;
  }

  const data = ctx.callbackQuery.data;

  if (data.startsWith('preview_price:')) {
    const draftId = data.substring(14);
    await handlePreviewPrice(ctx, draftId);
  } else if (data.startsWith('finalize:')) {
    const draftId = data.substring(9);
    await handleFinalize(ctx, draftId);
  } else if (data.startsWith('cancel:')) {
    const draftId = data.substring(7);
    await handleCancel(ctx, draftId);
  } else if (data.startsWith('channel_price:')) {
    const goldSetId = data.substring(14);
    await handleChannelPrice(ctx, goldSetId);
  } else if (data.startsWith('broadcast_submit:')) {
    const messageId = data.substring(17);
    await handleBroadcastSubmit(ctx, messageId);
  } else if (data.startsWith('broadcast_cancel:')) {
    const messageId = data.substring(17);
    await handleBroadcastCancel(ctx, messageId);
  }
}
