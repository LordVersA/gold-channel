/**
 * Price Calculator Service
 * Calculates gold set prices based on weight and spot price
 * Formula for normal users: weight × spot_price + 19% + 7%
 * Formula for collaborators (hamkar): weight × spot_price + 16% + 7%
 */

export class PriceCalculator {
  /**
   * Calculate normal (non-collaborator) price
   * Formula: weight × spot_price + 19% + 7%
   */
  static calculateNormalPrice(weightInGrams: number, spotPricePerGram: number): number {
    const basePrice = weightInGrams * spotPricePerGram;
    const withFirstMarkup = basePrice * 1.19; // +19%
    const finalPrice = withFirstMarkup * 1.07; // +7%
    return finalPrice;
  }

  /**
   * Calculate collaborator price
   * Formula: weight × spot_price + 16% + 7%
   */
  static calculateCollaboratorPrice(weightInGrams: number, spotPricePerGram: number): number {
    const basePrice = weightInGrams * spotPricePerGram;
    const withFirstMarkup = basePrice * 1.16; // +16%
    const finalPrice = withFirstMarkup * 1.07; // +7%
    return finalPrice;
  }

  /**
   * Format price with thousands separator and 2 decimal places
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  /**
   * Format weight with proper units
   */
  static formatWeight(grams: number): string {
    return `${grams}گرم`;
  }
}
