import { createEyebrow } from '../../scripts/ui/components.js';
import {
  formatDateRange, formatDayMonth, formatTimeZoneName, formatWeekday, joinParts,
} from '../../scripts/ui/format.js';
import { createSectionHeading, renderTournamentSection } from './block.js';
import { HIGHLIGHT_KEYS, highlightLabel } from './highlight-keys.js';
import LABELS from './labels.js';
import { createElement } from '../../scripts/utils/dom.js';

function createSession({ date, round, startTime }, timeZone) {
  const time = joinParts([startTime, startTime && formatTimeZoneName(date, timeZone)], ' ');
  return createElement('li', {
    className: 'tournament-session',
    children: [
      createElement('p', {
        className: 'tournament-session-day',
        children: [
          createEyebrow(formatWeekday(date), { tagName: 'span' }),
          createElement('time', { text: formatDayMonth(date), attributes: { datetime: date } }),
        ],
      }),
      createElement('h3', { className: 'tournament-session-round', text: round }),
      time && createElement('p', { className: 'tournament-session-time', text: time }),
    ].filter(Boolean),
  });
}

/**
 * Renders the day-by-day schedule of a tournament.
 * @param {Element} block The tournament block, schedule variant
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament }, authored) => {
    const { schedule } = tournament;
    if (!schedule.sessions.length) return null;
    return [
      createSectionHeading(authored, {
        eyebrow: highlightLabel(tournament, HIGHLIGHT_KEYS.schedule) || LABELS.schedule,
        title: formatDateRange(schedule.startDate, schedule.endDate) || LABELS.schedule,
      }),
      createElement('ol', {
        className: 'tournament-sessions',
        children: schedule.sessions.map((session) => createSession(session, schedule.timeZone)),
      }),
    ];
  });
}
