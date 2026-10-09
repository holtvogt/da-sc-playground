/*
 * Reads structured content records as JSON from the da.live structured content
 * delivery service, which resolves references, lists, and types server-side.
 * https://www.aem.live/docs/ew/administering/structured-content
 */

const DELIVERY_ORIGIN = 'https://da-sc.adobeaem.workers.dev';
const SITE = 'holtvogt/da-sc-playground';
const PREVIEW_HOSTS = /(?:^localhost$|\.aem\.page$|\.preview\.da\.live$)/;

/** Preview pages, local development, and the da.live canvas show previewed records. */
function readEnvironment() {
  return PREVIEW_HOSTS.test(window.location.hostname) ? 'preview' : 'live';
}

/**
 * Fetches a structured content record.
 * @param {string} path Site-relative record path, e.g. `/players/ada`
 * @param {string} schemaName Expected `x-schema-name`
 * @returns {Promise<object>} The record data
 */
export default async function readStructuredContent(path, schemaName) {
  const url = `${DELIVERY_ORIGIN}/${readEnvironment()}/${SITE}${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  const { metadata, data } = await response.json();
  if (metadata?.schemaName !== schemaName) throw new Error(`Expected ${schemaName} at ${path}`);
  return data;
}
