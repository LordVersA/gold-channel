import { prisma } from '../config/database';

/**
 * Admin Service
 * Handles admin user management
 */

export class AdminService {
  /**
   * Check if a user is an admin
   */
  static async isAdmin(userId: bigint, channelId?: string): Promise<boolean> {
    const where: any = { userId };
    if (channelId) {
      where.channelId = channelId;
    }

    const admin = await prisma.admin.findFirst({ where });
    return !!admin;
  }

  /**
   * Add a new admin
   */
  static async addAdmin(userId: bigint, channelId: string, telegramUsername?: string): Promise<void> {
    await prisma.admin.upsert({
      where: { userId },
      update: { channelId, telegramUsername },
      create: {
        userId,
        channelId,
        telegramUsername,
      },
    });
  }

  /**
   * Get all admins for a channel
   */
  static async getAdmins(channelId: string) {
    return await prisma.admin.findMany({
      where: { channelId },
    });
  }

  /**
   * Get admin by user ID
   */
  static async getAdmin(userId: bigint) {
    return await prisma.admin.findUnique({
      where: { userId },
    });
  }
}
