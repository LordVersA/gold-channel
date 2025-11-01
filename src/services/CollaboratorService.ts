import { prisma } from '../config/database';

/**
 * Collaborator Service
 * Handles collaborator user management
 */

export class CollaboratorService {
  /**
   * Check if a user is a collaborator
   */
  static async isCollaborator(userId: bigint): Promise<boolean> {
    const collaborator = await prisma.collaborator.findUnique({
      where: { userId },
    });
    return !!collaborator;
  }

  /**
   * Add a new collaborator
   */
  static async addCollaborator(userId: bigint, telegramUsername?: string): Promise<void> {
    await prisma.collaborator.upsert({
      where: { userId },
      update: { telegramUsername },
      create: {
        userId,
        telegramUsername,
      },
    });
  }

  /**
   * Get collaborator by user ID
   */
  static async getCollaborator(userId: bigint) {
    return await prisma.collaborator.findUnique({
      where: { userId },
    });
  }

  /**
   * Get all collaborators
   */
  static async getAllCollaborators() {
    return await prisma.collaborator.findMany();
  }
}
