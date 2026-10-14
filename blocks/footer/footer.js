import { isPageChrome, resolveChromePath } from '../../scripts/chrome.js';
import { loadChromeFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  if (!isPageChrome(block, 'footer')) return;

  // load footer as fragment
  const fragment = await loadChromeFragment(resolveChromePath('footer'));

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
