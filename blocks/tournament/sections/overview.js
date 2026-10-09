import { createEyebrow, createPhoto } from '../../../scripts/ui/components.js';
import { createElement } from '../../../scripts/utils/dom.js';
import LABELS from '../labels.js';
import { createSection, SECTION_KEYS } from './section.js';

function createHighlight({
  label, title, description, image,
}) {
  return createElement('li', {
    className: `tournament-highlight${image ? ' tournament-highlight-with-image' : ''}`,
    children: [
      image && createPhoto(image),
      createElement('div', {
        className: 'tournament-highlight-body',
        children: [
          label && createEyebrow(label),
          createElement('h3', { text: title }),
          description && createElement('p', { text: description }),
        ].filter(Boolean),
      }),
    ].filter(Boolean),
  });
}

/**
 * Renders the tournament highlights as an overview.
 * @returns {?import('./section.js').RenderedSection}
 */
export default function renderOverview(tournament) {
  if (!tournament.highlights.length) return null;
  const { section, rendered } = createSection({
    key: SECTION_KEYS.overview,
    navLabel: LABELS.overview,
    eyebrow: LABELS.overview,
    title: tournament.title,
    intro: tournament.experience.description,
    tone: 'dark',
  });
  section.append(createElement('ul', {
    className: 'tournament-highlights',
    children: tournament.highlights.map(createHighlight),
  }));
  return rendered;
}
