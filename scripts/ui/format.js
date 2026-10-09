const LOCALE = 'en-GB';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses `YYYY-MM-DD` as a calendar day. Formatting happens in UTC to keep the day stable. */
function parseDate(isoDate) {
  if (!ISO_DATE.test(isoDate)) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(isoDate, options) {
  const date = parseDate(isoDate);
  return date ? new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' }).format(date) : '';
}

/** @returns {string} e.g. `14–16 August 2025` */
export function formatDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  if (!start) return '';
  const end = parseDate(endDate) ?? start;
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).formatRange(start, end);
}

/** @returns {string} e.g. `Thursday` */
export function formatWeekday(isoDate) {
  return formatDay(isoDate, { weekday: 'long' });
}

/** @returns {string} e.g. `14 August` */
export function formatDayMonth(isoDate) {
  return formatDay(isoDate, { day: 'numeric', month: 'long' });
}

/** @returns {string} Short zone name on that day, e.g. `CEST` */
export function formatTimeZoneName(isoDate, timeZone) {
  const date = parseDate(isoDate);
  if (!date || !timeZone) return '';
  try {
    return new Intl.DateTimeFormat(LOCALE, { timeZone, timeZoneName: 'short' })
      .formatToParts(date)
      .find(({ type }) => type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

export function formatNumber(value) {
  return value === null ? '' : new Intl.NumberFormat(LOCALE).format(value);
}

/**
 * @param {?{amount: number, currency: string}} price `currency` is an ISO 4217 code
 * @returns {string} e.g. `€450`, or the plain amount without a valid currency
 */
export function formatPrice(price) {
  if (!price) return '';
  if (!price.currency) return formatNumber(price.amount);
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.amount);
  } catch {
    return formatNumber(price.amount);
  }
}

/** Joins the non-empty parts. */
export function joinParts(parts, separator = ' · ') {
  return parts.filter((part) => part || part === 0).join(separator);
}

export function formatLocation({ city, country }) {
  return joinParts([city, country], ', ');
}
