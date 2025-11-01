import { BotContext } from '../types/context';
import { prisma } from '../config/database';
import { Messages } from '../utils/messages';
import { toPersianNumber } from '../utils/formatters';
import { AdminService } from '../services/AdminService';
import { Collaborator } from '@prisma/client';

const ITEMS_PER_PAGE = 10;

/**
 * Handle /listhamkar command
 * Admin-only command to list collaborators with pagination and delete option
 */
export async function handleListHamkar(ctx: BotContext): Promise<void> {
  try {
    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      await ctx.reply(Messages.errorNotAdmin);
      return;
    }

    await showCollaboratorsList(ctx, 0);
  } catch (error) {
    console.error('Error in handleListHamkar:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}

/**
 * Show collaborators list with pagination
 */
export async function showCollaboratorsList(ctx: BotContext, page: number): Promise<void> {
  try {
    const skip = page * ITEMS_PER_PAGE;

    // Get total count and paginated list
    const [total, collaborators] = await Promise.all([
      prisma.collaborator.count(),
      prisma.collaborator.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { registeredAt: 'desc' }
      })
    ]);

    if (total === 0) {
      await ctx.reply(Messages.noCollaborators);
      return;
    }

    // Build message
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const currentPage = page + 1;

    let message = `${Messages.collaboratorsListTitle}\n\n`;
    message += `📊 تعداد کل: ${toPersianNumber(total)} همکار\n`;
    message += `📄 صفحه ${toPersianNumber(currentPage)} از ${toPersianNumber(totalPages)}\n\n`;

    // Add collaborators list
    collaborators.forEach((collab: Collaborator, index: number) => {
      const number = skip + index + 1;
      const username = collab.telegramUsername ? `@${collab.telegramUsername}` : 'بدون نام کاربری';
      const userId = collab.userId.toString();
      message += `${toPersianNumber(number)}. ${username}\n`;
      message += `   ID: ${toPersianNumber(userId)}\n`;
      message += `   تاریخ ثبت: ${formatDate(collab.registeredAt)}\n\n`;
    });

    // Build inline keyboard
    const buttons = [];

    // Add delete buttons for each collaborator
    const deleteButtons = collaborators.map((collab: Collaborator) => ({
      text: `🗑 حذف ${collab.telegramUsername || collab.userId.toString().slice(-4)}`,
      callback_data: `delham:${collab.id}`
    }));

    // Add delete buttons in rows of 2
    for (let i = 0; i < deleteButtons.length; i += 2) {
      buttons.push(deleteButtons.slice(i, i + 2));
    }

    // Add navigation buttons
    const navButtons = [];
    if (page > 0) {
      navButtons.push({ text: '◀️ قبلی', callback_data: `hamlist:${page - 1}` });
    }
    if (currentPage < totalPages) {
      navButtons.push({ text: 'بعدی ▶️', callback_data: `hamlist:${page + 1}` });
    }

    if (navButtons.length > 0) {
      buttons.push(navButtons);
    }

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  } catch (error) {
    console.error('Error showing collaborators list:', error);
    await ctx.reply(Messages.errorGeneric);
  }
}

/**
 * Handle pagination callback (hamlist:page)
 */
export async function handlePaginationCallback(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    const page = parseInt(data.split(':')[1]);

    // Delete the old message
    await ctx.deleteMessage();

    // Show new page
    await showCollaboratorsList(ctx, page);

    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Error handling pagination:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}

/**
 * Handle delete collaborator callback (delham:id)
 */
export async function handleDeleteCollaboratorCallback(ctx: BotContext): Promise<void> {
  try {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

    const admin = await AdminService.getAdmin(BigInt(ctx.from!.id));
    if (!admin) {
      await ctx.answerCbQuery(Messages.errorNotAdmin);
      return;
    }

    const data = ctx.callbackQuery.data;
    const collabId = parseInt(data.split(':')[1]);

    // Get collaborator info before deleting
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: collabId }
    });

    if (!collaborator) {
      await ctx.answerCbQuery(Messages.collaboratorNotFound);
      return;
    }

    // Delete the collaborator
    await prisma.collaborator.delete({
      where: { id: collabId }
    });

    // Show confirmation popup
    await ctx.answerCbQuery(Messages.collaboratorDeleted(collaborator.telegramUsername || collaborator.userId.toString()));

    // Refresh the list (stay on same page if possible)
    await ctx.deleteMessage();
    await showCollaboratorsList(ctx, 0);
  } catch (error) {
    console.error('Error deleting collaborator:', error);
    await ctx.answerCbQuery(Messages.errorGeneric);
  }
}

/**
 * Format date to Persian
 */
function formatDate(date: Date): string {
  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return toPersianNumber(persianDate);
}
