import { loadChromeFragment } from '../fragment/fragment.js';
import { resolveChromePath } from '../../scripts/page/chrome.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerPath = resolveChromePath('footer');
  const fragment = await loadChromeFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
