import { findHighlight, HIGHLIGHT_KEYS } from '../../scripts/structured-content/tournament.js';
import { createEyebrow } from '../../scripts/ui/components.js';
import {
  formatDateRange, formatDayMonth, formatTimeZoneName, formatWeekday, joinParts,
} from '../../scripts/ui/format.js';
import { createSectionHeading, renderTournamentSection } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';
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
 * @param {Element} block The tournament schedule block
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament }, authored) => {
    const { schedule } = tournament;
    if (!schedule.sessions.length) return null;
    return [
      createSectionHeading(authored, {
        eyebrow: findHighlight(tournament, HIGHLIGHT_KEYS.schedule).label || LABELS.schedule,
        title: formatDateRange(schedule.startDate, schedule.endDate) || LABELS.schedule,
      }),
      createElement('ol', {
        className: 'tournament-sessions',
        children: schedule.sessions.map((session) => createSession(session, schedule.timeZone)),
      }),
    ];
  });
}
