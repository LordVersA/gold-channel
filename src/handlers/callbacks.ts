import { BotContext } from '../types/context';
import { GoldPriceService } from '../services/GoldPriceService';
import { GoldSetService } from '../services/GoldSetService';
import { PriceCalculator } from '../services/PriceCalculator';
import { AdminService } from '../services/AdminService';
import { ChannelConfigService } from '../services/ChannelConfigService';
import { getUserIdBigInt } from '../utils/telegram';
import { formatDateTime, formatCurrency, formatWeight } from '../utils/formatters';
import { Messages, getPersianFieldName } from '../utils/messages';
import { Markup } from 'telegraf';
import { clearSession } from '../middleware/session';
import { handleBroadcastSubmit, handleBroadcastCancel } from './pmhamkar';
import { handlePaginationCallback, handleDeleteCollaboratorCallback } from './listhamkar';

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
    // Get admin's channel for config
    const userId = getUserIdBigInt(ctx);
    if (!userId) {
      await ctx.answerCbQuery(Messages.errorGeneric);
      return;
    }

    const admin = await AdminService.getAdmin(userId);
    if (!admin) {
      await ctx.answerCbQuery('کانال تنظیم نشده است.');
      return;
    }

    // Get spot price
    const spotPrice = await GoldPriceService.getCachedPrice();

    // Get pricing config
    const pricingConfig = await ChannelConfigService.getPricingConfig(admin.channelId);

    // Check if user is collaborator
    const isCollab = ctx.isCollaborator || false;

    // Calculate prices using channel config
    let message: string;
    if (isCollab) {
      const prices = await PriceCalculator.calculateBothPrices(
        session.albumWeight,
        spotPrice,
        admin.channelId
      );
      message = Messages.pricePopupCollab(
        formatDateTime(new Date()),
        formatWeight(session.albumWeight),
        formatCurrency(spotPrice),
        pricingConfig.collab.tax,
        pricingConfig.collab.laborFee,
        pricingConfig.collab.sellingProfit,
        formatCurrency(prices.collabPrice),
        formatCurrency(prices.customerPrice)
      );
    } else {
      const customerPrice = await PriceCalculator.calculateNormalPrice(
        session.albumWeight,
        spotPrice,
        admin.channelId
      );
      message = Messages.pricePopupCustomer(
        formatDateTime(new Date()),
        formatWeight(session.albumWeight),
        formatCurrency(spotPrice),
        pricingConfig.customer.tax,
        pricingConfig.customer.laborFee,
        pricingConfig.customer.sellingProfit,
        formatCurrency(customerPrice)
      );
    }

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

    // Get pricing config (now handles post-level overrides)
    const pricingValues = await GoldSetService.getPricingValues(
      goldSet,
      goldSet.channelId
    );

    // Convert to percentage for display
    const pricingConfig = {
      customer: {
        tax: Math.round(pricingValues.customerTax.value * 100),
        laborFee: Math.round(pricingValues.customerLaborFee.value * 100),
        sellingProfit: Math.round(pricingValues.customerSellingProfit.value * 100),
      },
      collab: {
        tax: Math.round(pricingValues.collabTax.value * 100),
        laborFee: Math.round(pricingValues.collabLaborFee.value * 100),
        sellingProfit: Math.round(pricingValues.collabSellingProfit.value * 100),
      },
    };

    // Check if user is collaborator
    const isCollab = ctx.isCollaborator || false;

    // Calculate prices (pass goldSet for post-level pricing)
    let message: string;
    if (isCollab) {
      const prices = await PriceCalculator.calculateBothPrices(
        goldSet.weight,
        spotPrice,
        goldSet.channelId,
        goldSet  // CHANGED: pass goldSet
      );
      message = Messages.pricePopupCollab(
        formatDateTime(new Date()),
        formatWeight(goldSet.weight),
        formatCurrency(spotPrice),
        pricingConfig.collab.tax,
        pricingConfig.collab.laborFee,
        pricingConfig.collab.sellingProfit,
        formatCurrency(prices.collabPrice),
        formatCurrency(prices.customerPrice)
      );
    } else {
      const customerPrice = await PriceCalculator.calculateNormalPrice(
        goldSet.weight,
        spotPrice,
        goldSet.channelId,
        goldSet  // CHANGED: pass goldSet
      );
      message = Messages.pricePopupCustomer(
        formatDateTime(new Date()),
        formatWeight(goldSet.weight),
        formatCurrency(spotPrice),
        pricingConfig.customer.tax,
        pricingConfig.customer.laborFee,
        pricingConfig.customer.sellingProfit,
        formatCurrency(customerPrice)
      );
    }

    // Log price check
    await GoldSetService.logPriceCheck(userId, goldSet.id);

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
  } else if (data.startsWith('hamlist:')) {
    await handlePaginationCallback(ctx);
  } else if (data.startsWith('delham:')) {
    await handleDeleteCollaboratorCallback(ctx);
  } else if (data.startsWith('edit_pricing:')) {
    await handlePricingEdit(ctx);
  } else if (data.startsWith('reset_pricing:')) {
    await handlePricingReset(ctx);
  }
}

/**
 * Handle pricing field edit button click
 */
async function handlePricingEdit(ctx: BotContext) {
  try {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const data = ctx.callbackQuery.data!;
    const parts = data.split(':');
    // parts[0] = 'edit_pricing'
    // parts[1] = goldSetId
    // parts[2] = fieldName

    const goldSetId = parseInt(parts[1]);
    const fieldName = parts[2];

    // Validate field name
    const validFields = [
      'customerTax',
      'customerLaborFee',
      'customerSellingProfit',
      'collabTax',
      'collabLaborFee',
      'collabSellingProfit',
    ];

    if (!validFields.includes(fieldName)) {
      await ctx.answerCbQuery('فیلد نامعتبر است.');
      return;
    }

    // Store in session
    if (ctx.session) {
      ctx.session.editingGoldSetId = goldSetId;
      ctx.session.editingPricingField = fieldName;
      ctx.session.awaitingPricingValue = true;
    }

    // Get field label in Persian
    const fieldLabel = getPersianFieldName(fieldName);

    await ctx.answerCbQuery();
    await ctx.reply(Messages.editPricingPrompt(fieldLabel));
  } catch (error) {
    console.error('Error in handlePricingEdit:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}

/**
 * Handle reset pricing button click
 */
async function handlePricingReset(ctx: BotContext) {
  try {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const data = ctx.callbackQuery.data!;
    const parts = data.split(':');
    const goldSetId = parseInt(parts[1]);

    // Reset all pricing fields to NULL
    await GoldSetService.resetPostPricing(goldSetId);

    // Delete the menu message
    if (ctx.callbackQuery?.message) {
      try {
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      } catch (e) {
        // Ignore deletion errors
      }
    }

    await ctx.answerCbQuery();
    await ctx.reply(Messages.postPricingReset);
  } catch (error) {
    console.error('Error in handlePricingReset:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}
