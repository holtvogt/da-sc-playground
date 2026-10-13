/*
 * Reads structured content records as JSON from the da.live structured content
 * delivery service, which resolves references, lists, and types server-side.
 * https://www.aem.live/docs/ew/administering/structured-content
 */

const PUBLIC_DELIVERY_ORIGIN = 'https://da-sc.adobeaem.workers.dev';
const LOCAL_DELIVERY_ORIGIN = 'http://localhost:8787';
const SITE = 'holtvogt/da-sc-playground';
const PREVIEW_HOSTS = /(?:^localhost$|\.aem\.page$|\.preview\.da\.live$)/;

const LOCAL_PROBE_TIMEOUT_MS = 500;

/** Preview pages, local development, and the da.live canvas show previewed records. */
function readEnvironment() {
  return PREVIEW_HOSTS.test(window.location.hostname) ? 'preview' : 'live';
}

/** Any response means a local da-sc worker is running. */
async function isLocalDeliveryRunning() {
  try {
    await fetch(LOCAL_DELIVERY_ORIGIN, { signal: AbortSignal.timeout(LOCAL_PROBE_TIMEOUT_MS) });
    return true;
  } catch {
    return false;
  }
}

async function resolveDeliveryOrigin() {
  if (window.location.hostname !== 'localhost') return PUBLIC_DELIVERY_ORIGIN;
  return await isLocalDeliveryRunning() ? LOCAL_DELIVERY_ORIGIN : PUBLIC_DELIVERY_ORIGIN;
}

/** Probed once per page, so every record on the page reads from the same worker. */
let deliveryOrigin;
function readDeliveryOrigin() {
  deliveryOrigin ??= resolveDeliveryOrigin();
  return deliveryOrigin;
}

/**
 * Fetches a structured content record.
 * @param {string} path Site-relative record path, e.g. `/players/ada`
 * @param {string} schemaName Expected `x-schema-name`
 * @returns {Promise<object>} The record data
 */
export default async function readStructuredContent(path, schemaName) {
  const url = `${await readDeliveryOrigin()}/${readEnvironment()}/${SITE}${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  const { metadata, data } = await response.json();
  if (metadata?.schemaName !== schemaName) throw new Error(`Expected ${schemaName} at ${path}`);
  return data;
}
