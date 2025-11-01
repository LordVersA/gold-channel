import { BotContext } from '../types/context';
import { getUserIdBigInt } from '../utils/telegram';
import { validateWeight } from '../utils/validators';
import { Messages } from '../utils/messages';
import { Markup } from 'telegraf';
import crypto from 'crypto';

/**
 * Handle photo messages for single image album creation
 * Admin-only feature
 */

export async function handlePhoto(ctx: BotContext) {
  if (!ctx.isAdmin || !ctx.message || !('photo' in ctx.message)) {
    return;
  }

  const userId = getUserIdBigInt(ctx);
  if (!userId) return;

  const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Get largest photo

  // React with fire emoji for photo
  try {
    await ctx.react('🔥');
  } catch (error) {
    console.error('Failed to react to photo:', error);
  }

  // Initialize session if needed
  if (!ctx.session) {
    return;
  }

  // Store photo and create draft
  ctx.session.albumPhoto = photo.file_id;
  ctx.session.draftId = crypto.randomBytes(16).toString('hex');
  ctx.session.awaitingCaption = true;

  // Clear previous state
  delete ctx.session.albumCaption;
  delete ctx.session.albumWeight;

  // Ask for caption with cancel button
  await ctx.reply(
    Messages.imageReceived,
    Markup.inlineKeyboard([
      [Markup.button.callback(Messages.cancelButton, `cancel:${ctx.session.draftId}`)],
    ])
  );
}

/**
 * Handle text messages for caption or weight input
 */
export async function handleTextInput(ctx: BotContext) {
  if (!ctx.isAdmin || !ctx.message || !('text' in ctx.message)) {
    return;
  }

  const text = ctx.message.text;

  // If awaiting caption, store it and ask for weight
  if (ctx.session?.awaitingCaption) {
    // React with writing emoji for caption
    try {
      await ctx.react('✍');
    } catch (error) {
      console.error('Failed to react to caption:', error);
    }
    ctx.session.albumCaption = text;
    ctx.session.awaitingCaption = false;
    ctx.session.awaitingWeight = true;

    // Ask for weight with cancel button
    await ctx.reply(
      Messages.captionReceived,
      Markup.inlineKeyboard([
        [Markup.button.callback(Messages.cancelButton, `cancel:${ctx.session.draftId}`)],
      ])
    );
    return;
  }

  // If awaiting weight, validate and store it
  if (ctx.session?.awaitingWeight) {
    // React with trophy emoji for weight
    try {
      await ctx.react('🏆');
    } catch (error) {
      console.error('Failed to react to weight:', error);
    }

    await handleWeightInput(ctx, text);
    return;
  }
}

/**
 * Handle weight input
 */
async function handleWeightInput(ctx: BotContext, weightText: string) {
  const weight = validateWeight(weightText);

  if (!weight) {
    await ctx.reply(Messages.weightInvalid);
    return;
  }

  // Store weight
  if (ctx.session) {
    ctx.session.albumWeight = weight;
    ctx.session.awaitingWeight = false;
  }

  // Proceed to preview
  await showPreview(ctx);
}

/**
 * Show album preview with control buttons
 */
async function showPreview(ctx: BotContext) {
  const session = ctx.session;
  if (!session || !session.albumPhoto || !session.albumWeight || !session.draftId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  try {
    // Send photo with "Price Now" button attached (exactly like channel post)
    const sentMessage = await ctx.telegram.sendPhoto(
      ctx.chat!.id,
      session.albumPhoto,
      {
        caption: session.albumCaption || '',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(Messages.channelPriceNow, `preview_price:${session.draftId}`)],
        ]),
      }
    );

    // Store the preview message ID for deletion later
    session.previewMessageId = sentMessage.message_id;

    // Add Finalize/Cancel buttons as a separate message
    const controlMessage = await ctx.telegram.sendMessage(
      ctx.chat!.id,
      Messages.albumPreview,
      {
        reply_parameters: { message_id: sentMessage.message_id },
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(Messages.previewFinalize, `finalize:${session.draftId}`),
            Markup.button.callback(Messages.previewCancel, `cancel:${session.draftId}`),
          ],
        ]),
      }
    );

    // Store the control message ID for deletion later
    session.controlMessageId = controlMessage.message_id;
  } catch (error) {
    console.error('Error showing preview:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
