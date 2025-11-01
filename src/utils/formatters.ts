import { toZonedTime } from 'date-fns-tz';
import { config } from '../config/config';
import moment from 'moment-jalaali';

/**
 * Format utilities for dates, currency, and other data
 */

/**
 * Convert English numbers to Persian numbers
 */
export function toPersianNumber(input: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = input.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(englishDigits[i], 'g'), persianDigits[i]);
  }
  return result;
}

/**
 * Format a date to Shamsi (Jalali/Persian) calendar with Persian numbers
 * Returns format: YYYY/MM/DD HH:mm:ss
 */
export function formatDateTime(date: Date): string {
  const zonedDate = toZonedTime(date, config.timezone);
  const m = moment(zonedDate);
  const formatted = m.format('jYYYY/jMM/jDD HH:mm:ss');
  return toPersianNumber(formatted);
}

/**
 * Format currency in Toman (converted from Rial)
 * Displays with thousands separator and no decimals (Persian numbers)
 */
export function formatCurrency(amountInRial: number): string {
  const amountInToman = amountInRial / 10;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInToman);
  return toPersianNumber(formatted) + ' تومان';
}

/**
 * Format weight in grams (Persian numbers)
 */
export function formatWeight(grams: number): string {
  return `${toPersianNumber(grams)} گرم`;
}
