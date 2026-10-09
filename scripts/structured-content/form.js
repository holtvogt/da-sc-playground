/*
 * Reads the `.da-form` metadata block of a structured content document.
 * It has no dependencies, so page scripts can detect records cheaply.
 */

const SCHEMA_FIELD = 'x-schema-name';

/**
 * @param {ParentNode} root Document or element containing the metadata block
 * @param {string} name Field name, e.g. `title`
 * @returns {string} Field value, or an empty string when it is missing
 */
export function readFormField(root, name) {
  const rows = [...(root.querySelector('.da-form')?.children ?? [])];
  const row = rows.find((candidate) => candidate.children[0]?.textContent.trim() === name);
  return row?.children[1]?.textContent.trim() ?? '';
}

/**
 * @param {ParentNode} root Document or element containing the metadata block
 * @returns {string} Schema name, or an empty string for regular documents
 */
export function readSchemaName(root) {
  return readFormField(root, SCHEMA_FIELD);
}
