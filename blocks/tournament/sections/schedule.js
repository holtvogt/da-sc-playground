import {
  formatDateRange, formatDayMonth, formatTimeZoneName, formatWeekday, joinParts,
} from '../../../scripts/ui/format.js';
import { createEyebrow } from '../../../scripts/ui/components.js';
import { createElement } from '../../../scripts/utils/dom.js';
import LABELS from '../labels.js';
import { createSection, highlightLabel, SECTION_KEYS } from './section.js';

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
 * Renders the day-by-day schedule.
 * @returns {?import('./section.js').RenderedSection}
 */
export default function renderSchedule(tournament) {
  const { schedule } = tournament;
  if (!schedule.sessions.length) return null;
  const { section, rendered } = createSection({
    key: SECTION_KEYS.schedule,
    navLabel: LABELS.schedule,
    eyebrow: highlightLabel(tournament, SECTION_KEYS.schedule) || LABELS.schedule,
    title: formatDateRange(schedule.startDate, schedule.endDate) || LABELS.schedule,
  });
  section.append(createElement('ol', {
    className: 'tournament-sessions',
    children: schedule.sessions.map((session) => createSession(session, schedule.timeZone)),
  }));
  return rendered;
}
