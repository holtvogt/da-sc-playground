import { createFacts } from '../../scripts/ui/components.js';
import renderPlayerRoster from '../../scripts/ui/player-card.js';
import { createSectionHeading, renderTournamentSection } from './block.js';
import { HIGHLIGHT_KEYS, highlightLabel } from './highlight-keys.js';
import LABELS from './labels.js';
import { createElement } from '../../scripts/utils/dom.js';

function bySeedThenName(first, second) {
  const seedOrder = (first.seed ?? Infinity) - (second.seed ?? Infinity);
  return seedOrder || first.name.localeCompare(second.name);
}

function byGroupName(first, second) {
  if (!first.name || !second.name) return Number(!first.name) - Number(!second.name);
  return first.name.localeCompare(second.name);
}

/** Groups players by their group name. Ungrouped players come last. */
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

function createCompetitionFacts({ competition }, groups) {
  const { groupCount, bestOfGames, pointsPerGame } = competition;
  const sizes = new Set(groups.map(({ players }) => players.length));
  const perGroup = groups.length === groupCount && sizes.size === 1 ? [...sizes][0] : null;
  return createFacts('tournament-competition', [
    [LABELS.discipline, competition.discipline],
    [LABELS.format, competition.format],
    [LABELS.groups, groupCount > 0 ? LABELS.groupSummary(groupCount, perGroup) : ''],
    [
      LABELS.matches,
      bestOfGames > 0 && pointsPerGame > 0 ? LABELS.matchSummary(bestOfGames, pointsPerGame) : '',
    ],
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
function createGroup({ name, players }, index) {
  const roster = renderPlayerRoster(players, { headingLevel: name ? 4 : 3 });
  if (!name) {
    return createElement('div', { className: 'tournament-group', children: [roster] });
  }
  return createElement('details', {
    className: 'tournament-group',
    attributes: index === 0 ? { open: '' } : {},
    children: [createGroupToggle(name, players.length), roster],
  });
}

/**
 * Renders every entrant of a tournament, grouped and ordered by seed.
 * @param {Element} block The tournament block, contenders variant
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament, players }, authored) => {
    if (!players.length) return null;
    const groups = groupPlayers(players);
    const heading = createSectionHeading(authored, {
      eyebrow: highlightLabel(tournament, HIGHLIGHT_KEYS.players) || LABELS.contenders,
      title: LABELS.contendersTitle,
    });
    const facts = createCompetitionFacts(tournament, groups);
    if (facts) heading.append(facts);
    return [heading, ...groups.map(createGroup)];
  }, { withPlayers: true });
}
