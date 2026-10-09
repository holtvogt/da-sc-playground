import { buildBlock } from '../aem.js';
import { createElement } from '../utils/dom.js';

/**
 * Builds a block that renders a structured content record, referenced the same
 * way authors reference it, through a link in its only cell.
 * @param {string} blockName
 * @param {string} recordPath Site-relative path of the record
 * @returns {HTMLElement}
 */
export default function buildRecordBlock(blockName, recordPath) {
  const link = createElement('a', { text: recordPath, attributes: { href: recordPath } });
  return buildBlock(blockName, [[link]]);
}
