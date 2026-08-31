import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

/**
 * Format any ISO/UTC date string into Cambodia local time (ICT, UTC+7) using Day.js (Option B)
 * Example output: "31 Aug 2026, 03:12:17 PM" or custom format
 */
export function formatCambodiaTime(date, formatStr = 'YYYY-MM-DD hh:mm:ss A') {
  if (!date) return 'N/A';
  return dayjs(date).tz(CAMBODIA_TIMEZONE).format(formatStr);
}

/**
 * Format date for table displays in Cambodia local time (ICT, UTC+7)
 * Example output: "31 Aug 2026, 03:12:17 PM (ICT)"
 */
export function formatCambodiaShort(date) {
  if (!date) return 'N/A';
  return dayjs(date).tz(CAMBODIA_TIMEZONE).format('DD MMM YYYY, hh:mm:ss A');
}

/**
 * Format date to ISO UTC format string
 */
export function formatUTC(date) {
  if (!date) return 'N/A';
  return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss UTC');
}

export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}


