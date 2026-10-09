/*
 * Structured content is authored, so values can be missing or malformed.
 * These helpers turn any value into a safe default that renderers can skip.
 */

const SITE_PATH = /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;
const DOCUMENT_EXTENSION = /(?:\.plain)?\.html$/;

export function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function toNumber(value) {
  const text = toText(value);
  const number = Number(text);
  return text && Number.isFinite(number) ? number : null;
}

export function toRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toList(value) {
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

export function toRecords(value) {
  return toList(value).filter((item) => typeof item === 'object');
}

export function toTextList(value) {
  return toList(value).map(toText).filter(Boolean);
}

function toHttpsUrl(value) {
  const url = toText(value);
  return url.startsWith('https://') ? url : '';
}

/** @returns {boolean} Whether the value is a site-relative document path, e.g. `/players/ada` */
export function isSitePath(value) {
  return SITE_PATH.test(value);
}

/**
 * Turns an authored link into the path of the record it points to.
 * @param {string} href Absolute or relative link, with or without a document extension
 * @returns {string} Site-relative path, e.g. `/players/ada`
 */
export function toRecordPath(href) {
  return new URL(href, window.location).pathname.replace(DOCUMENT_EXTENSION, '');
}

/**
 * Accepts secure URLs, such as AEM Assets delivery URLs, and same-origin URLs,
 * such as media bus images that the parser resolved.
 */
function toImageUrl(value) {
  try {
    const url = new URL(toText(value));
    return url.protocol === 'https:' || url.origin === window.location.origin ? url.href : '';
  } catch {
    return '';
  }
}

/** @typedef {{name: string, url: string}} ImageCredit */
/** @typedef {{src: string, alt: string, credit: ?ImageCredit, licenseUrl: string}} Image */

/**
 * An image needs a secure source and alt text. Credit and license are optional.
 * @returns {?Image}
 */
export function toImage(value) {
  const image = toRecord(value);
  const src = toImageUrl(image.src);
  const alt = toText(image.alt);
  if (!src || !alt) return null;

  const credit = toRecord(image.credit);
  const creditName = toText(credit.name);
  return {
    src,
    alt,
    credit: creditName ? { name: creditName, url: toHttpsUrl(credit.url) } : null,
    licenseUrl: toHttpsUrl(image.licenseUrl),
  };
}
