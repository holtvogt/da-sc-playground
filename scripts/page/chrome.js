import { getMetadata } from '../aem.js';

/** Pages share the nav and footer fragments unless their metadata names others. */
const CHROME_FRAGMENTS = Object.freeze({
  nav: 'body > header',
  footer: 'body > footer',
});

/**
 * Resolves the path of a chrome fragment for the current page.
 * @param {'nav'|'footer'} name The fragment name, which is also its metadata key
 * @returns {string} The site-relative fragment path
 */
export function resolveChromePath(name) {
  const configured = getMetadata(name);
  return configured ? new URL(configured, window.location).pathname : `/${name}`;
}

/**
 * Removes the chrome that a nav or footer page does not author, so the
 * da.live canvas previews only the fragment being edited.
 * @param {Document} doc The page document
 */
export function removeUneditedChrome(doc) {
  const { pathname } = window.location;
  const edited = Object.keys(CHROME_FRAGMENTS).find((name) => resolveChromePath(name) === pathname);
  if (!edited) return;
  Object.entries(CHROME_FRAGMENTS)
    .filter(([name]) => name !== edited)
    .forEach(([, selector]) => doc.querySelector(selector)?.remove());
}
