import { createOptimizedPicture } from '../aem.js';
import { createElement } from '../utils/dom.js';
import { isMediaBusUrl } from '../utils/media.js';

/*
 * Presentational components shared by blocks. Styles live in /styles/components.css.
 * Containers that render them add the `ui-reset` class to neutralize global
 * element styles.
 */

const LABELS = Object.freeze({
  photoCredit: 'Photography by',
  license: 'License',
});

function createExternalLink(text, href) {
  return createElement('a', {
    text,
    attributes: { href, target: '_blank', rel: 'noopener noreferrer' },
  });
}

function createCredit({ credit, licenseUrl }) {
  const author = credit.url ? createExternalLink(credit.name, credit.url) : credit.name;
  const license = licenseUrl && createExternalLink(LABELS.license, licenseUrl);
  return createElement('figcaption', {
    children: [`${LABELS.photoCredit} `, author, license && ' · ', license].filter(Boolean),
  });
}

/**
 * Media bus images get responsive renditions. Other sources, such as AEM Assets
 * delivery URLs, are used as authored.
 */
function createImage({ src, alt }, eager) {
  if (isMediaBusUrl(new URL(src))) return createOptimizedPicture(src, alt, eager);
  return createElement('img', {
    attributes: { src, alt, loading: eager ? 'eager' : 'lazy' },
  });
}

/**
 * Creates a small uppercase label shown above a heading.
 * @param {string} text
 * @param {object} [options]
 * @param {string} [options.className] Additional class names
 * @param {string} [options.tagName] Use `span` inside phrasing content
 */
export function createEyebrow(text, { className = '', tagName = 'p' } = {}) {
  return createElement(tagName, { className: `ui-eyebrow ${className}`.trim(), text });
}

/**
 * Creates a credited photo, or an empty frame when no image is authored.
 * @param {?import('../structured-content/fields.js').Image} image
 * @param {object} [options]
 * @param {boolean} [options.eager] Load eagerly (above the fold)
 * @param {string} [options.placeholder] Text shown in the empty frame
 */
export function createPhoto(image, { eager = false, placeholder = '' } = {}) {
  if (!image) {
    return createElement('figure', {
      className: 'ui-photo ui-photo-empty',
      children: [createElement('span', { text: placeholder, attributes: { 'aria-hidden': 'true' } })],
    });
  }
  const media = createImage(image, eager);
  const img = media.querySelector('img') ?? media;
  img.decoding = 'async';
  if (eager) img.fetchPriority = 'high';
  return createElement('figure', {
    className: 'ui-photo',
    children: [media, image.credit && createCredit(image)].filter(Boolean),
  });
}

/**
 * Creates a definition list from `[label, value]` pairs, skipping empty values.
 * @param {string} className Additional class names
 * @param {Array<[string, *]>} entries
 * @returns {?HTMLDListElement} null when nothing is left to show
 */
export function createFacts(className, entries) {
  const items = entries
    .filter(([, value]) => value || value === 0)
    .map(([label, value]) => createElement('div', {
      children: [
        createElement('dt', { text: label }),
        createElement('dd', { text: value }),
      ],
    }));
  return items.length
    ? createElement('dl', { className: `ui-facts ${className}`, children: items })
    : null;
}

/**
 * Creates a list of tags.
 * @param {string[]} tags
 * @param {string} label Accessible name of the list
 * @returns {?HTMLUListElement} null for an empty list
 */
export function createTags(tags, label) {
  if (!tags.length) return null;
  return createElement('ul', {
    className: 'ui-tags',
    attributes: { 'aria-label': label },
    children: tags.map((tag) => createElement('li', { className: 'ui-tag', text: tag })),
  });
}

/**
 * Creates a notice shown in place of content that could not be loaded.
 * @param {string} text
 */
export function createAlert(text) {
  return createElement('p', { className: 'ui-alert', text, attributes: { role: 'alert' } });
}
