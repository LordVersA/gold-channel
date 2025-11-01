import { prisma } from '../config/database';
import { config } from '../config/config';
import crypto from 'crypto';

/**
 * Token Service
 * Handles invite token generation and validation
 */

export class TokenService {
  /**
   * Generate a unique token
   */
  private static generateUniqueToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate an invite token
   */
  static async generateToken(
    type: 'collab' | 'admin',
    createdBy: bigint,
    channelId?: string
  ): Promise<string> {
    const token = this.generateUniqueToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.inviteTokenExpiry);

    await prisma.inviteToken.create({
      data: {
        token,
        type,
        createdBy,
        channelId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Validate a token
   * Returns token data if valid, null if invalid/expired/used
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    type?: 'collab' | 'admin';
    channelId?: string | null;
  }> {
    const tokenData = await prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return { valid: false };
    }

    if (tokenData.used) {
      return { valid: false };
    }

    if (tokenData.expiresAt < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      type: tokenData.type as 'collab' | 'admin',
      channelId: tokenData.channelId,
    };
  }

  /**
   * Mark a token as used
   */
  static async consumeToken(token: string): Promise<void> {
    await prisma.inviteToken.update({
      where: { token },
      data: { used: true },
    });
  }
}
