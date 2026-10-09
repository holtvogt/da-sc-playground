import { createEyebrow, createPhoto } from '../../../scripts/ui/components.js';
import { formatDateRange, joinParts } from '../../../scripts/ui/format.js';
import { createElement } from '../../../scripts/utils/dom.js';
import LABELS from '../labels.js';
import { SECTION_KEYS } from './section.js';

function createTitle(lines) {
  return createElement('h1', {
    className: 'tournament-hero-title',
    children: lines.map((line) => createElement('span', { text: line })),
  });
}

function createActions(sections) {
  const [first] = sections;
  const contenders = sections.find(({ key }) => key === SECTION_KEYS.players);
  const actions = [
    first && createElement('a', {
      className: 'tournament-button',
      text: LABELS.heroPrimaryAction,
      attributes: { href: `#${first.id}` },
    }),
    contenders && contenders !== first && createElement('a', {
      className: 'tournament-text-link',
      text: LABELS.heroSecondaryAction,
      attributes: { href: `#${contenders.id}` },
    }),
  ].filter(Boolean);
  return actions.length
    ? createElement('p', { className: 'tournament-hero-actions', children: actions })
    : null;
}

function createMedia(tournament) {
  if (!tournament.heroImage) return null;
  const edition = LABELS.edition(tournament.year, tournament.status);
  return createElement('div', {
    className: 'tournament-hero-media',
    children: [
      createPhoto(tournament.heroImage, { eager: true }),
      edition && createElement('p', { className: 'tournament-hero-badge', text: edition }),
    ].filter(Boolean),
  });
}

/**
 * Renders the hero. The authored tagline wins over the tournament name as heading.
 * @param {object} tournament Normalized tournament
 * @param {object} options
 * @param {string[]} options.taglineLines Authored heading lines, may be empty
 * @param {import('./section.js').RenderedSection[]} options.sections Rendered sections to link to
 */
export default function renderHero(tournament, { taglineLines, sections }) {
  const { schedule, venue } = tournament;
  const eyebrow = joinParts([venue.city, formatDateRange(schedule.startDate, schedule.endDate)]);
  const copy = createElement('div', {
    className: 'tournament-hero-copy',
    children: [
      eyebrow && createEyebrow(eyebrow, { className: 'tournament-hero-eyebrow' }),
      createTitle(taglineLines.length ? taglineLines : [tournament.title]),
      tournament.summary && createElement('p', { className: 'tournament-hero-lead', text: tournament.summary }),
      createActions(sections),
    ].filter(Boolean),
  });

  const media = createMedia(tournament);
  return createElement('div', {
    className: `tournament-hero${media ? ' tournament-hero-with-media' : ''}`,
    children: [copy, media].filter(Boolean),
  });
}
