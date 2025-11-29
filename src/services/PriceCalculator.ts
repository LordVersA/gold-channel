import { ChannelConfigService } from './ChannelConfigService';
import { toPersianNumber } from '../utils/formatters';

/**
 * Price Calculator Service
 * Calculates gold set prices based on weight and spot price
 * Formula: (weight × spot_price) × (1 + tax + laborFee + sellingProfit)
 * Percentages are fetched from channel configuration
 */

export class PriceCalculator {
  /**
   * Calculate normal (non-collaborator) price using channel config
   * Formula: (weight × spot_price) × (1 + tax + laborFee + sellingProfit)
   */
  static async calculateNormalPrice(
    weightInGrams: number,
    spotPricePerGram: number,
    channelId: string,
    goldSet?: any  // NEW: optional post-level config
  ): Promise<number> {
    const config = await ChannelConfigService.getOrCreateConfig(channelId);

    // Use post-level values if available, otherwise channel defaults
    const customerTax = goldSet?.customerTax ?? config.customerTax;
    const customerLaborFee = goldSet?.customerLaborFee ?? config.customerLaborFee;
    const customerSellingProfit = goldSet?.customerSellingProfit ?? config.customerSellingProfit;

    const basePrice = weightInGrams * spotPricePerGram;
    const totalMarkup = 1 + customerTax + customerLaborFee + customerSellingProfit;
    const finalPrice = basePrice * totalMarkup;
    return finalPrice;
  }

  /**
   * Calculate collaborator price using channel config
   * Formula: (weight × spot_price) × (1 + tax + laborFee + sellingProfit)
   */
  static async calculateCollaboratorPrice(
    weightInGrams: number,
    spotPricePerGram: number,
    channelId: string,
    goldSet?: any  // NEW: optional post-level config
  ): Promise<number> {
    const config = await ChannelConfigService.getOrCreateConfig(channelId);

    // Use post-level values if available, otherwise channel defaults
    const collabTax = goldSet?.collabTax ?? config.collabTax;
    const collabLaborFee = goldSet?.collabLaborFee ?? config.collabLaborFee;
    const collabSellingProfit = goldSet?.collabSellingProfit ?? config.collabSellingProfit;

    const basePrice = weightInGrams * spotPricePerGram;
    const totalMarkup = 1 + collabTax + collabLaborFee + collabSellingProfit;
    const finalPrice = basePrice * totalMarkup;
    return finalPrice;
  }

  /**
   * Calculate both customer and collaborator prices
   * Returns object with both prices for display to collaborators
   */
  static async calculateBothPrices(
    weightInGrams: number,
    spotPricePerGram: number,
    channelId: string,
    goldSet?: any  // NEW: optional post-level config
  ): Promise<{ customerPrice: number; collabPrice: number }> {
    const [customerPrice, collabPrice] = await Promise.all([
      this.calculateNormalPrice(weightInGrams, spotPricePerGram, channelId, goldSet),
      this.calculateCollaboratorPrice(weightInGrams, spotPricePerGram, channelId, goldSet),
    ]);

    return { customerPrice, collabPrice };
  }

  /**
   * Format price with thousands separator and 2 decimal places (Persian numbers)
   */
  static formatPrice(price: number): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
    return toPersianNumber(formatted);
  }

  /**
   * Format weight with proper units (Persian numbers)
   */
  static formatWeight(grams: number): string {
    return `${toPersianNumber(grams)}گرم`;
  }
}
