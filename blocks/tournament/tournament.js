import { loadCSS } from '../../scripts/aem.js';

/*
 * Renders one part of a tournament record, chosen by the block variant, e.g.
 * "Tournament (Venue)". Each variant lives in its own module and stylesheet.
 */

const VARIANTS = Object.freeze(['hero', 'highlights', 'schedule', 'venue', 'contenders', 'facts']);

/**
 * @param {Element} block The tournament block
 */
export default async function decorate(block) {
  const variant = VARIANTS.find((name) => block.classList.contains(name));
  if (!variant) {
    // eslint-disable-next-line no-console
    console.error(`Tournament block needs one of the variants ${VARIANTS.join(', ')}`);
    return;
  }
  const base = `${window.hlx.codeBasePath}/blocks/tournament/${variant}`;
  const [{ default: decorateVariant }] = await Promise.all([
    import(`${base}.js`),
    loadCSS(`${base}.css`),
  ]);
  await decorateVariant(block);
}
