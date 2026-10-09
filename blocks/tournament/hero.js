import { createEyebrow, createPhoto } from '../../scripts/ui/components.js';
import { formatDateRange, joinParts } from '../../scripts/ui/format.js';
import { decorateEyebrows, partitionAuthored, renderTournamentBlock } from './block.js';
import LABELS from './labels.js';
import { createElement } from '../../scripts/utils/dom.js';

function createEyebrowLine({ schedule, venue }) {
  const text = joinParts([venue.city, formatDateRange(schedule.startDate, schedule.endDate)]);
  return text && createEyebrow(text, { className: 'tournament-hero-eyebrow ui-eyebrow-ruled' });
}

function createActions(buttons) {
  return buttons.length
    ? createElement('div', { className: 'tournament-hero-actions', children: buttons })
    : null;
}

function decorateAuthoredEyebrows(eyebrows) {
  decorateEyebrows(eyebrows);
  eyebrows.forEach((eyebrow) => eyebrow.classList.add('tournament-hero-eyebrow'));
  return eyebrows;
}

function createTitle(heading, tournament) {
  const title = heading ?? createElement('h1', { text: tournament.title });
  title.classList.add('tournament-hero-title');
  return title;
}

function createLead(body, { summary }) {
  if (!body.length) {
    return summary ? [createElement('p', { className: 'tournament-hero-lead', text: summary })] : [];
  }
  body.filter(({ tagName }) => tagName === 'P')
    .forEach((paragraph) => paragraph.classList.add('tournament-hero-lead'));
  return body;
}

/**
 * Builds the copy column. Authored eyebrows, heading, text, and calls to action
 * win over the place and dates, the tournament name, and its summary.
 */
function createCopy(tournament, authored) {
  const {
    eyebrows, heading, body, buttons,
  } = partitionAuthored(authored);
  const eyebrowLine = eyebrows.length
    ? decorateAuthoredEyebrows(eyebrows)
    : [createEyebrowLine(tournament)];

  return createElement('div', {
    className: 'tournament-hero-copy',
    children: [
      ...eyebrowLine,
      createTitle(heading, tournament),
      ...createLead(body, tournament),
      createActions(buttons),
    ].filter(Boolean),
  });
}

function createMedia({ heroImage, year, status }) {
  if (!heroImage) return null;
  const edition = LABELS.edition(year, status);
  return createElement('div', {
    className: 'tournament-hero-media',
    children: [
      createPhoto(heroImage, { eager: true }),
      edition && createElement('p', { className: 'tournament-hero-badge', text: edition }),
    ].filter(Boolean),
  });
}

/**
 * Renders the hero of a tournament. Authors write the headline, lead, and
 * calls to action above the block. The dates, place, and photo come from the record.
 * @param {Element} block The tournament block, hero variant
 */
export default function decorate(block) {
  return renderTournamentBlock(block, ({ tournament }, authored) => [
    createCopy(tournament, authored),
    createMedia(tournament),
  ].filter(Boolean));
}
