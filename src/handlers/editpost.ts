import { BotContext } from '../types/context';
import { GoldSetService } from '../services/GoldSetService';
import { Messages, getPersianFieldName } from '../utils/messages';
import { Markup } from 'telegraf';
import { toPersianNumber } from '../utils/formatters';

/**
 * Handle forwarded channel posts for pricing editing
 * Returns true if handled, false if should pass to next handler
 */
export async function handlePostForward(ctx: BotContext): Promise<boolean> {
  try {
    // Check if message is forwarded from a channel
    if (!ctx.message || !('forward_from_chat' in ctx.message)) {
      return false;
    }

    const forwardInfo = ctx.message.forward_from_chat as any;
    if (!forwardInfo || forwardInfo.type !== 'channel') {
      return false;
    }

    const channelId = forwardInfo.id.toString();
    const messageId = (ctx.message as any).forward_from_message_id;

    if (!messageId) {
      return false;
    }

    // Try to find gold set
    const goldSet = await GoldSetService.getGoldSetByMessageId(channelId, messageId);

    if (!goldSet) {
      // Not a gold set post, let other handlers process
      return false;
    }

    // Show pricing edit menu
    await showPricingEditMenu(ctx, goldSet);
    return true;
  } catch (error) {
    console.error('Error in handlePostForward:', error);
    return false;
  }
}

/**
 * Show pricing edit menu with 6 buttons + reset button
 */
async function showPricingEditMenu(ctx: BotContext, goldSet: any) {
  // Get current pricing values with source indicators
  const pricingValues = await GoldSetService.getPricingValues(goldSet, goldSet.channelId);

  // Helper to format button label
  const formatButton = (fieldKey: string, fieldData: { value: number; isPostLevel: boolean }) => {
    const persianName = getPersianFieldName(fieldKey);
    const percentage = Math.round(fieldData.value * 100);
    const indicator = fieldData.isPostLevel ? '⭐' : '📋';
    return `${persianName} ${indicator} (${toPersianNumber(percentage)}٪)`;
  };

  const keyboard = Markup.inlineKeyboard([
    // Row 1: Customer Tax, Customer Labor Fee
    [
      Markup.button.callback(
        formatButton('customerTax', pricingValues.customerTax),
        `edit_pricing:${goldSet.id}:customerTax`
      ),
      Markup.button.callback(
        formatButton('customerLaborFee', pricingValues.customerLaborFee),
        `edit_pricing:${goldSet.id}:customerLaborFee`
      ),
    ],
    // Row 2: Customer Selling Profit, Collab Tax
    [
      Markup.button.callback(
        formatButton('customerSellingProfit', pricingValues.customerSellingProfit),
        `edit_pricing:${goldSet.id}:customerSellingProfit`
      ),
      Markup.button.callback(
        formatButton('collabTax', pricingValues.collabTax),
        `edit_pricing:${goldSet.id}:collabTax`
      ),
    ],
    // Row 3: Collab Labor Fee, Collab Selling Profit
    [
      Markup.button.callback(
        formatButton('collabLaborFee', pricingValues.collabLaborFee),
        `edit_pricing:${goldSet.id}:collabLaborFee`
      ),
      Markup.button.callback(
        formatButton('collabSellingProfit', pricingValues.collabSellingProfit),
        `edit_pricing:${goldSet.id}:collabSellingProfit`
      ),
    ],
    // Row 4: Reset button
    [
      Markup.button.callback(
        Messages.resetPricingButton,
        `reset_pricing:${goldSet.id}`
      ),
    ],
  ]);

  const message = await ctx.reply(Messages.editPricingMenu, keyboard);

  // Store menu message ID for cleanup
  if (ctx.session) {
    ctx.session.pricingEditMenuId = message.message_id;
  }
}

/**
 * Handle text input for pricing percentage value
 */
export async function handlePricingValueInput(ctx: BotContext, text: string): Promise<void> {
  if (!ctx.session?.awaitingPricingValue) {
    return;
  }

  try {
    // Parse percentage
    const percentage = parseFloat(text);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      await ctx.reply(Messages.invalidPercentage);
      return;
    }

    const goldSetId = ctx.session.editingGoldSetId!;
    const fieldName = ctx.session.editingPricingField!;

    // Update database (convert percentage to decimal)
    await GoldSetService.updatePricingField(goldSetId, fieldName, percentage / 100);

    // Clear session state
    ctx.session.awaitingPricingValue = false;
    delete ctx.session.editingGoldSetId;
    delete ctx.session.editingPricingField;

    // Delete edit menu if exists
    if (ctx.session.pricingEditMenuId) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.pricingEditMenuId);
      } catch (e) {
        // Ignore deletion errors
      }
      delete ctx.session.pricingEditMenuId;
    }

    // Confirm update
    const fieldLabel = getPersianFieldName(fieldName);
    await ctx.reply(Messages.pricingFieldUpdated(fieldLabel, percentage));
  } catch (error) {
    console.error('Error in handlePricingValueInput:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}
