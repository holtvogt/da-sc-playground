/*
 * EDS media bus helpers. The media bus serves images that authors upload or that
 * EDS ingests on preview, as `media_<hash>.<ext>` files of the site.
 */

const MEDIA_BUS_FILE = /\/media_[0-9a-f]+\.[a-z0-9]+$/i;

/**
 * @param {URL} url
 * @returns {boolean} Whether the URL points to a media bus file of this site
 */
export default function isMediaBusUrl(url) {
  return url.origin === window.location.origin && MEDIA_BUS_FILE.test(url.pathname);
}
