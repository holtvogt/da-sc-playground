import { createEyebrow, createPhoto } from '../../scripts/ui/components.js';
import { createElement } from '../../scripts/utils/dom.js';
import { createSectionHeading, renderTournamentSection } from '../../scripts/ui/tournament-block.js';
import LABELS from '../../scripts/ui/tournament-labels.js';

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
 * Renders the highlights of a tournament as an overview.
 * @param {Element} block The tournament highlights block
 */
export default function decorate(block) {
  return renderTournamentSection(block, ({ tournament }, authored) => {
    if (!tournament.highlights.length) return null;
    return [
      createSectionHeading(authored, {
        eyebrow: LABELS.overview,
        title: tournament.title,
        intro: tournament.experience.description,
      }),
      createElement('ul', {
        className: 'tournament-highlights-list',
        children: tournament.highlights.map(createHighlight),
      }),
    ];
  });
}
