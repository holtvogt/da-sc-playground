import { findHighlight, HIGHLIGHT_KEYS } from '../../scripts/structured-content/tournament.js';
import { createAlert, createFacts } from '../../scripts/ui/components.js';
import renderPlayerRoster, { PLAYER_CARD_LABELS } from '../../scripts/ui/player-card.js';
import { createSectionHeading, renderTournamentSection } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';
import { createElement } from '../../scripts/utils/dom.js';

/** Labels authors may override, including those of the player cards. */
const CONTENDERS_LABELS = Object.freeze({
  discipline: LABELS.discipline,
  format: LABELS.format,
  groups: LABELS.groups,
  matches: LABELS.matches,
  ...PLAYER_CARD_LABELS,
});

function bySeedThenName(first, second) {
  const seedOrder = (first.seed ?? Infinity) - (second.seed ?? Infinity);
  return seedOrder || first.name.localeCompare(second.name);
}

function byGroupName(first, second) {
  if (!first.name || !second.name) return Number(!first.name) - Number(!second.name);
  return first.name.localeCompare(second.name);
}

/**
 * Groups players by the group in their record, so a new player record joins
 * its group once the tournament lists it. Ungrouped players come last.
 */
function groupPlayers(players) {
  const groups = new Map();
  players.forEach((player) => {
    if (!groups.has(player.group)) groups.set(player.group, []);
    groups.get(player.group).push(player);
  });
  return [...groups]
    .map(([name, members]) => ({ name, players: members.sort(bySeedThenName) }))
    .sort(byGroupName);
}

/** Summarizes the named groups, such as `2 groups of 3`. */
function summarizeGroups(groups) {
  const named = groups.filter(({ name }) => name);
  if (!named.length) return '';
  const sizes = new Set(named.map(({ players }) => players.length));
  return LABELS.groupSummary(named.length, sizes.size === 1 ? [...sizes][0] : null);
}

function summarizeMatches({ bestOfGames, pointsPerGame }) {
  return bestOfGames > 0 && pointsPerGame > 0
    ? LABELS.matchSummary(bestOfGames, pointsPerGame) : '';
}

function createCompetitionFacts({ competition }, groups, labels) {
  return createFacts('tournament-competition', [
    [labels.place('discipline'), competition.discipline],
    [labels.place('format'), competition.format],
    [labels.place('groups'), summarizeGroups(groups)],
    [labels.place('matches'), summarizeMatches(competition)],
  ]);
}

function createGroupToggle(name, playerCount) {
  return createElement('summary', {
    className: 'tournament-group-toggle',
    children: [
      createElement('h3', { className: 'tournament-group-title', text: LABELS.group(name) }),
      createElement('span', { className: 'tournament-group-count', text: LABELS.playerCount(playerCount) }),
    ],
  });
}

/**
 * Renders a named group as a collapsible roster. Players without a group are
 * listed as they are, since there is nothing to name the toggle after.
 * Player names rank below the group heading, or below the section title.
 */
function createGroup({ name, players }, labels) {
  const roster = renderPlayerRoster(players, { headingLevel: name ? 4 : 3, labels });
  if (!name) {
    return createElement('div', { className: 'tournament-group', children: [roster] });
  }
  return createElement('details', {
    className: 'tournament-group',
    children: [createGroupToggle(name, players.length), roster],
  });
}

/** Tells readers why no players show, since the tournament may list none yet. */
function createMissingPlayersNotice(tournament) {
  return tournament.entrants.length
    ? createAlert(LABELS.playersLoadError)
    : createElement('p', { className: 'ui-alert', text: LABELS.noPlayers });
}

/**
 * Renders every entrant of a tournament, grouped and ordered by seed.
 * @param {Element} block The tournament contenders block
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament, players }, authored, labels) => {
    const groups = groupPlayers(players);
    const heading = createSectionHeading(authored, {
      eyebrow: findHighlight(tournament, HIGHLIGHT_KEYS.players).label || LABELS.contenders,
      title: LABELS.contendersTitle,
    });
    const facts = createCompetitionFacts(tournament, groups, labels);
    if (facts) heading.append(facts);
    if (!players.length) return [heading, createMissingPlayersNotice(tournament)];
    return [heading, ...groups.map((group) => createGroup(group, labels))];
  }, { withPlayers: true, labels: CONTENDERS_LABELS });
}
