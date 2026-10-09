import { resolveImageSource } from '../utils/media.js';
import { readSchemaName } from './form.js';

const REFERENCE_PREFIX = 'self://#';

/**
 * Indexes the blocks that `self://#kind-id` references can point to.
 * @param {Document} document
 * @returns {Map<string, Element>}
 */
function indexReferences(document) {
  const references = new Map();
  document.querySelectorAll('div[class]').forEach((block) => {
    const [kind, reference] = block.classList;
    if (!reference?.startsWith(`${kind}-`)) return;
    if (references.has(reference)) throw new Error(`Duplicate structured block ${reference}`);
    references.set(reference, block);
  });
  return references;
}

/**
 * Parses a structured content document (as served by `.plain.html`) into a plain object.
 * `self://#kind-id` references resolve to nested objects and `ul` values become arrays.
 * A value that holds an image and no text, as written for `x-semantic-type: media`
 * fields, resolves to the absolute image URL.
 * @param {string} html Document markup
 * @param {string} schemaName Expected `x-schema-name`
 * @param {string} path Document path, which relative image sources resolve against
 * @returns {object}
 */
function parseStructuredContent(html, schemaName, path) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  if (readSchemaName(document) !== schemaName) {
    throw new Error(`Expected ${schemaName} structured content`);
  }
  const references = indexReferences(document);

  function parseBlock(block, ancestors = new Set()) {
    function parseValue(text) {
      if (!text.startsWith(REFERENCE_PREFIX)) return text;
      const reference = text.slice(REFERENCE_PREFIX.length);
      const target = references.get(reference);
      if (!target) throw new Error(`Missing structured block ${reference}`);
      if (ancestors.has(reference)) throw new Error(`Cyclic structured block ${reference}`);
      return parseBlock(target, new Set([...ancestors, reference]));
    }

    function readValue(element) {
      const text = element.textContent.trim();
      if (text) return parseValue(text);
      const image = element.querySelector('img[src]');
      return image ? resolveImageSource(image.getAttribute('src'), path) : '';
    }

    const fields = {};
    [...block.children].forEach((row) => {
      const [label, value] = row.children;
      const key = label?.querySelector('h3')?.textContent.trim();
      if (!key || !value || row.children.length !== 2) {
        throw new Error(`Invalid structured row in ${schemaName}`);
      }
      if (Object.hasOwn(fields, key)) throw new Error(`Duplicate structured field ${key}`);
      const list = value.querySelector(':scope > ul');
      fields[key] = list ? [...list.children].map(readValue) : readValue(value);
    });
    return fields;
  }

  const root = document.querySelector(`.${schemaName}`);
  if (!root) throw new Error(`Missing ${schemaName} structured block`);
  return parseBlock(root);
}

/**
 * Fetches and parses a structured content document.
 * @param {string} path Document path including the `.plain.html` extension
 * @param {string} schemaName Expected `x-schema-name`
 * @returns {Promise<object>}
 */
export default async function readStructuredContent(path, schemaName) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  return parseStructuredContent(await response.text(), schemaName, path);
}
