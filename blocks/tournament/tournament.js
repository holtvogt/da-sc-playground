import applyShowcaseTheme from '../../scripts/page/theme.js';
import { settleTournamentPage } from '../../scripts/page/tournament-page.js';
import { toRecordPath } from '../../scripts/structured-content/fields.js';
import loadTournament from '../../scripts/structured-content/tournament.js';
import { createAlert } from '../../scripts/ui/components.js';
import { formatDateRange, formatLocation } from '../../scripts/ui/format.js';
import LABELS from './labels.js';
import renderContenders from './sections/contenders.js';
import renderHero from './sections/hero.js';
import renderOverview from './sections/overview.js';
import renderSchedule from './sections/schedule.js';
import renderVenue from './sections/venue.js';

/** Page sections in display order. Each renderer returns null when its data is missing. */
const SECTION_RENDERERS = [renderOverview, renderSchedule, renderVenue, renderContenders];

/** Reads text lines, treating `<br>` and paragraph boundaries as line breaks. */
function readLines(element) {
  const lines = [''];
  const visit = (node) => {
    if (node.nodeName === 'BR' || node.nodeName === 'P') lines.push('');
    if (node.nodeType === Node.TEXT_NODE) lines[lines.length - 1] += node.textContent;
    node.childNodes.forEach(visit);
  };
  visit(element);
  return lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Reads the authored block. One cell links to the tournament record, and an
 * optional heading or text cell provides the tagline.
 */
function readConfiguration(block) {
  const link = block.querySelector('a[href]');
  const recordPath = link ? toRecordPath(link.href) : '';
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const taglineSource = block.querySelector('h1, h2, h3, h4, h5, h6')
    ?? cells.find((cell) => !cell.querySelector('a') && cell.textContent.trim());
  return { recordPath, taglineLines: taglineSource ? readLines(taglineSource) : [] };
}

function updateDocumentMetadata(tournament) {
  const title = [tournament.title, tournament.year].filter(Boolean).join(' ');
  const image = tournament.heroImage;
  document.title = title;
  [
    ['meta[property="og:title"]', title],
    ['meta[name="twitter:title"]', title],
    ['meta[name="description"]', tournament.summary],
    ['meta[property="og:description"]', tournament.summary],
    ['meta[name="twitter:description"]', tournament.summary],
    ['meta[property="og:image"]', image?.src],
    ['meta[property="og:image:secure_url"]', image?.src],
    ['meta[property="og:image:alt"]', image?.alt],
    ['meta[name="twitter:image"]', image?.src],
  ].forEach(([selector, content]) => {
    const meta = document.head.querySelector(selector);
    if (meta && content) meta.content = content;
  });
}

function summarize(tournament, sections) {
  const { schedule, venue } = tournament;
  return {
    title: tournament.title,
    dates: formatDateRange(schedule.startDate, schedule.endDate),
    location: formatLocation(venue),
    sections: sections.map(({ id, label }) => ({ id, label })),
  };
}

function showLoadError(block, error) {
  block.replaceChildren(createAlert(LABELS.loadError));
  // eslint-disable-next-line no-console
  console.error('Structured tournament loading failed', error);
}

/**
 * Renders a tournament page from a `table-tennis-tournament` structured content record.
 * @param {Element} block The tournament block element
 */
export default async function decorate(block) {
  applyShowcaseTheme();
  block.classList.add('ui-reset');
  const { recordPath, taglineLines } = readConfiguration(block);
  try {
    const { tournament, players } = await loadTournament(recordPath);
    const sections = SECTION_RENDERERS
      .map((render) => render(tournament, players))
      .filter(Boolean);
    block.replaceChildren(
      renderHero(tournament, { taglineLines, sections }),
      ...sections.map(({ element }) => element),
    );
    updateDocumentMetadata(tournament);
    settleTournamentPage(summarize(tournament, sections));
  } catch (error) {
    showLoadError(block, error);
    settleTournamentPage(null);
  }
}
