/**
 * Creates an element in one expression.
 * @param {string} tagName Element tag name
 * @param {object} [options]
 * @param {string} [options.className] Space-separated class names
 * @param {string|number} [options.text] Text content
 * @param {Object<string, string>} [options.attributes] Attributes to set
 * @param {Array<Node|string>} [options.children] Child nodes to append
 * @returns {HTMLElement}
 */
// eslint-disable-next-line import/prefer-default-export
export function createElement(tagName, {
  className, text, attributes = {}, children = [],
} = {}) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.append(...children);
  return element;
}
