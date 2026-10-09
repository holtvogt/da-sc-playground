/*
 * EDS media bus helpers. The media bus serves images that authors upload or that
 * EDS ingests on preview, as `./media_<hash>.<ext>` relative to their document.
 */

const MEDIA_BUS_FILE = /\/media_[0-9a-f]+\.[a-z0-9]+$/i;

/**
 * @param {URL} url
 * @returns {boolean} Whether the URL points to a media bus file of this site
 */
export function isMediaBusUrl(url) {
  return url.origin === window.location.origin && MEDIA_BUS_FILE.test(url.pathname);
}

/**
 * Resolves an image source relative to the document it appears in. Media bus
 * sources drop their rendition parameters, so renderers can request their own sizes.
 * @param {string} src Source as delivered, e.g. `./media_1a2b.jpg?width=750&format=jpg`
 * @param {string} documentPath Path of the document the source appears in
 * @returns {string} Absolute URL, or an empty string for an invalid source
 */
export function resolveImageSource(src, documentPath) {
  try {
    const url = new URL(src, new URL(documentPath, window.location.href));
    if (isMediaBusUrl(url)) {
      url.search = '';
      url.hash = '';
    }
    return url.href;
  } catch {
    return '';
  }
}
