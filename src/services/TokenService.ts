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
   * Collaborator tokens never expire and can be reused
   * Admin tokens expire and are one-time use
   */
  static async generateToken(
    type: 'collab' | 'admin',
    createdBy: bigint,
    channelId?: string
  ): Promise<string> {
    const token = this.generateUniqueToken();

    // Collaborator tokens never expire (far future date)
    // Admin tokens expire after configured days
    const expiresAt = new Date();
    if (type === 'collab') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100); // Never expire (100 years)
    } else {
      expiresAt.setDate(expiresAt.getDate() + config.inviteTokenExpiry);
    }

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
   * Collaborator tokens: can be reused, never expire (in practice)
   * Admin tokens: one-time use, expire after configured days
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

    // Collaborator tokens can be reused (skip 'used' check)
    // Admin tokens are one-time use only
    if (tokenData.type === 'admin' && tokenData.used) {
      return { valid: false };
    }

    // Check expiration
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
   * Only applies to admin tokens (collaborator tokens can be reused)
   */
  static async consumeToken(token: string, type: 'collab' | 'admin'): Promise<void> {
    // Only mark admin tokens as used
    if (type === 'admin') {
      await prisma.inviteToken.update({
        where: { token },
        data: { used: true },
      });
    }
    // Collaborator tokens are never marked as used (can be reused)
  }
}
