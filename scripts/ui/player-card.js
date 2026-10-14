import { toClassName } from '../aem.js';
import { createElement } from '../utils/dom.js';
import BlockLabels from './block-labels.js';
import {
  createEyebrow, createFacts, createPhoto, createTags,
} from './components.js';
import { joinParts } from './format.js';

/*
 * Player cards for any block that lists players. Styles live in
 * /styles/player-card.css, which blocks import from their own stylesheet.
 */

/** Labels of a player card, which blocks may let authors override. */
export const PLAYER_CARD_LABELS = Object.freeze({
  seed: 'Seed',
  ranking: 'Ranking',
  age: 'Age',
  hand: 'Hand',
  debut: 'Debut',
  equipment: 'Equipment',
  blade: 'Blade',
  forehand: 'Forehand',
  backhand: 'Backhand',
});

const strengthsOf = (name) => `${name} strengths`;

let renderedPanels = 0;

function initials(name) {
  const letters = name.split(/\s+/).map((word) => word[0]).join('');
  return letters.slice(0, 2).toUpperCase();
}

function createPortrait(player, labels) {
  const portrait = createPhoto(player.image, { placeholder: initials(player.name) });
  if (player.seed !== null) {
    const seed = `${labels.text('seed')} ${player.seed}`;
    portrait.append(createElement('span', { className: 'player-card-seed', text: seed }));
  }
  return portrait;
}

function createIntro(player, headingLevel) {
  const style = joinParts([player.archetype, player.grip]);
  return createElement('div', {
    className: 'player-card-intro',
    children: [
      player.nationality && createEyebrow(player.nationality),
      createElement(`h${headingLevel}`, { className: 'player-card-name', text: player.name }),
      style && createElement('p', { className: 'player-card-style', text: style }),
      player.bio && createElement('p', { className: 'player-card-bio', text: player.bio }),
    ].filter(Boolean),
  });
}

/**
 * A button with a separate panel (instead of `<details>`) lets the roster grid
 * give the panel its own row, so opening it never shifts sibling cards.
 */
function createEquipmentDisclosure(player, labels) {
  const { blade, forehandRubber, backhandRubber } = player.equipment;
  const panel = createFacts('player-card-equipment', [
    [labels.text('blade'), blade],
    [labels.text('forehand'), forehandRubber],
    [labels.text('backhand'), backhandRubber],
  ]);
  if (!panel) return {};

  renderedPanels += 1;
  panel.id = `equipment-${toClassName(player.path)}-${renderedPanels}`;
  panel.hidden = true;
  const toggle = createElement('button', {
    className: 'player-card-toggle',
    text: labels.text('equipment'),
    attributes: { type: 'button', 'aria-expanded': 'false', 'aria-controls': panel.id },
  });
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  });
  return { toggle, panel };
}

function createDetails(player, toggle, labels) {
  return createElement('div', {
    className: 'player-card-details',
    children: [
      createFacts('player-card-stats', [
        [labels.text('ranking'), player.ranking],
        [labels.text('age'), player.age],
        [labels.text('hand'), player.handedness],
        [labels.text('debut'), player.debutYear],
      ]),
      createTags(player.strengths, strengthsOf(player.name)),
      toggle,
    ].filter(Boolean),
  });
}

/**
 * Renders one player as a card with four rows: portrait, intro, details, and equipment.
 */
function renderPlayerCard(player, headingLevel, labels) {
  const { toggle, panel } = createEquipmentDisclosure(player, labels);
  return createElement('li', {
    className: 'player-card',
    children: [
      createPortrait(player, labels),
      createIntro(player, headingLevel),
      createDetails(player, toggle, labels),
      panel,
    ].filter(Boolean),
  });
}

/**
 * Renders players as a roster of cards. Card rows line up across the roster through a subgrid.
 * @param {object[]} players Normalized players
 * @param {object} [options]
 * @param {number} [options.headingLevel] Heading level of player names, 1 to 6
 * @param {BlockLabels} [options.labels] Card labels, keyed as {@link PLAYER_CARD_LABELS}
 * @returns {HTMLOListElement}
 */
export default function renderPlayerRoster(players, {
  headingLevel = 3, labels = new BlockLabels(PLAYER_CARD_LABELS),
} = {}) {
  return createElement('ol', {
    className: 'player-roster ui-reset',
    children: players.map((player) => renderPlayerCard(player, headingLevel, labels)),
  });
}
