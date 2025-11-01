import { BotContext } from '../types/context';
import { getUserIdBigInt } from '../utils/telegram';
import { Messages } from '../utils/messages';
import { CollaboratorService } from '../services/CollaboratorService';
import { Markup } from 'telegraf';

/**
 * Handle /pmhamkar command
 * Admin-only command to broadcast messages to all collaborators
 */

export async function handlePmHamkar(ctx: BotContext) {
  const userId = getUserIdBigInt(ctx);
  if (!userId) {
    await ctx.reply(Messages.errorGeneric);
    return;
  }

  // Set session state to await broadcast message
  if (!ctx.session) {
    ctx.session = {};
  }
  ctx.session.awaitingBroadcastMessage = true;

  await ctx.reply(Messages.pmHamkarInstructions);
}

/**
 * Handle incoming message for broadcast (called from message handler)
 */
export async function handleBroadcastMessage(ctx: BotContext) {
  if (!ctx.session?.awaitingBroadcastMessage) {
    return;
  }

  const message = ctx.message;
  if (!message || !ctx.chat) {
    return;
  }

  // Store message details in session
  ctx.session.broadcastMessageId = message.message_id;
  ctx.session.broadcastChatId = ctx.chat.id;
  ctx.session.awaitingBroadcastMessage = false;

  // Copy the message to show as preview
  await ctx.telegram.copyMessage(ctx.chat.id, ctx.chat.id, message.message_id);

  // Send buttons in a separate message
  const previewButtons = Markup.inlineKeyboard([
    [
      Markup.button.callback(Messages.broadcastSubmit, `broadcast_submit:${message.message_id}`),
      Markup.button.callback(Messages.broadcastCancel, `broadcast_cancel:${message.message_id}`)
    ]
  ]);

  const controlMessage = await ctx.reply(Messages.broadcastPreview, previewButtons);
  ctx.session.broadcastControlMessageId = controlMessage.message_id;
}

/**
 * Handle broadcast submit button
 */
export async function handleBroadcastSubmit(ctx: BotContext, messageId: string) {
  const session = ctx.session;
  if (!session || session.broadcastMessageId !== parseInt(messageId)) {
    await ctx.answerCbQuery('پیش‌نمایش منقضی شده است.');
    return;
  }

  try {
    // Get all collaborators
    const collaborators = await CollaboratorService.getAllCollaborators();

    if (collaborators.length === 0) {
      await ctx.answerCbQuery('هیچ همکاری یافت نشد.');
      return;
    }

    // Broadcast message to all collaborators
    let successCount = 0;
    let failCount = 0;

    for (const collaborator of collaborators) {
      try {
        // Copy the message to each collaborator (not forward)
        await ctx.telegram.copyMessage(
          collaborator.userId.toString(),
          session.broadcastChatId!,
          parseInt(messageId)
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to send to collaborator ${collaborator.userId}:`, error);
        failCount++;
      }
    }

    // Delete the control message with buttons
    if (session.broadcastControlMessageId && ctx.chat?.id) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, session.broadcastControlMessageId);
      } catch (error) {
        console.error('Failed to delete control message:', error);
      }
    }

    // Clear session
    delete session.broadcastMessageId;
    delete session.broadcastChatId;
    delete session.broadcastControlMessageId;

    // Show results
    const resultMessage = Messages.broadcastResult(successCount, failCount);
    await ctx.answerCbQuery(Messages.broadcastSent);
    await ctx.reply(resultMessage);

  } catch (error) {
    console.error('Error broadcasting message:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}

/**
 * Handle broadcast cancel button
 */
export async function handleBroadcastCancel(ctx: BotContext, messageId: string) {
  const session = ctx.session;
  if (!session || session.broadcastMessageId !== parseInt(messageId)) {
    await ctx.answerCbQuery('عملیات منقضی شده است.');
    return;
  }

  // Delete the control message with buttons
  if (session.broadcastControlMessageId && ctx.chat?.id) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, session.broadcastControlMessageId);
    } catch (error) {
      console.error('Failed to delete control message:', error);
    }
  }

  // Clear session
  delete session.broadcastMessageId;
  delete session.broadcastChatId;
  delete session.broadcastControlMessageId;

  await ctx.answerCbQuery(Messages.actionCancelled);
  await ctx.reply(Messages.actionCancelled);
}
