import {
  normalizePlayer,
  normalizeTournament,
  readStructuredContent,
} from './structured-content.js';

const tournamentPath = '/tournaments/monte-carlo-invitational.plain.html';

async function loadTournament() {
  const tournament = normalizeTournament(
    await readStructuredContent(tournamentPath, 'table-tennis-tournament'),
  );

  const players = await Promise.all(tournament.entrants.map(async (entrant) => {
    const player = await readStructuredContent(`${entrant.player}.plain.html`, 'table-tennis-player');
    return normalizePlayer(player, entrant);
  }));
  return { tournament, players };
}

function dateRange({ startDate, endDate }) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  if (startDate.slice(0, 7) === endDate.slice(0, 7)) {
    return `${start.getUTCDate()}-${formatter.format(end)}`;
  }
  return `${formatter.format(start)} to ${formatter.format(end)}`;
}

function node(tag, className, text) {
  const item = document.createElement(tag);
  item.className = className;
  item.textContent = text;
  return item;
}

function photo(image, eager = false) {
  const figure = node('figure', 'luxury-photo', '');
  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.alt;
  img.loading = eager ? 'eager' : 'lazy';
  img.decoding = 'async';
  figure.append(img);

  const credit = node('figcaption', '', 'Photography by ');
  const link = node('a', '', image.credit.name);
  link.href = image.credit.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  credit.append(link);
  figure.append(credit);
  return figure;
}

function decorateHero(hero, tournament) {
  const columns = hero.querySelector(':scope > div');
  const copy = columns?.firstElementChild;
  const visual = columns?.lastElementChild;
  const heading = copy?.querySelector('h1');
  const description = heading?.nextElementSibling;
  const actions = description?.nextElementSibling;
  const tournamentLink = actions?.querySelector('a[href="/tournament"]');
  const sourceImage = visual?.querySelector('picture, img');

  if (!heading || !description || !tournamentLink || !sourceImage) {
    // eslint-disable-next-line no-console
    console.error('Homepage design requires the authored hero heading, description, link, and image.');
    return false;
  }

  hero.id = 'event';
  heading.id = 'monte-carlo-invitational';
  heading.replaceChildren(
    node('span', 'luxury-heading-top', 'The game,'),
    node('span', 'luxury-heading-bottom', 'elevated.'),
  );
  copy.prepend(node('p', 'luxury-eyebrow', 'A table tennis concept'));
  description.textContent = tournament.summary;
  description.classList.add('luxury-lead');
  actions.classList.add('luxury-actions');
  tournamentLink.href = '#experience';
  tournamentLink.textContent = 'Explore the concept';

  const playersLink = node('a', 'luxury-text-link', 'Meet the contenders');
  playersLink.href = '#contenders';
  actions.append(playersLink);

  visual.classList.add('luxury-hero-image');
  const imageContainer = sourceImage.parentElement?.tagName === 'P'
    && sourceImage.parentElement.children.length === 1
    && !sourceImage.parentElement.textContent.trim()
    ? sourceImage.parentElement : sourceImage;
  imageContainer.replaceWith(photo(tournament.media.hero, true));
  visual.append(node('span', 'luxury-image-index', `${tournament.year} CONCEPT EDITION`));
  return true;
}

function decorateCards(block, tournament) {
  const section = block.parentElement;
  const highlights = Object.fromEntries(
    tournament.highlights.map((highlight) => [highlight.key, highlight]),
  );
  section.id = 'experience';
  section.insertBefore(node('p', 'luxury-section-label', 'The tournament'), block);
  section.insertBefore(node('h2', 'luxury-section-title', 'A tournament reimagined.'), block);
  section.insertBefore(
    node('p', 'luxury-section-intro', tournament.experience.description),
    block,
  );

  block.querySelectorAll(':scope > div').forEach((row) => {
    const link = row.querySelector('a[href^="/tournament#"]');
    const key = link?.hash.slice(1);
    const detail = highlights[key];
    const heading = row.querySelector('h3');
    const description = heading?.nextElementSibling;
    if (!detail || !heading || !description) return;

    if (key === 'venue') row.firstElementChild.id = 'venue';
    heading.removeAttribute('id');
    heading.textContent = detail.title;
    heading.before(node('p', 'luxury-card-label', detail.label));
    description.textContent = detail.description;
    description.after(photo(tournament.media.highlights[key]));
    link.closest('p')?.remove();
  });
}

function addContenders(main, players) {
  const section = node('section', 'luxury-roster', '');
  section.id = 'contenders';
  section.setAttribute('aria-labelledby', 'contenders-title');
  const introduction = node('div', 'luxury-roster-intro', '');
  introduction.append(
    node('p', 'luxury-section-label', 'The field'),
    node('h2', '', 'Meet the contenders.'),
    node('p', '', 'Six fictional contenders bring different ways of winning to the same table. Split into two groups of three, they turn each rally into a test of timing, patience, and nerve.'),
  );
  introduction.querySelector('h2').id = 'contenders-title';
  section.append(introduction);

  const groups = node('div', 'luxury-roster-groups', '');
  ['A', 'B'].forEach((groupName) => {
    const group = node('div', 'luxury-roster-group', '');
    group.append(node('h3', '', `Group ${groupName}`));

    const list = node('ol', 'luxury-roster-list', '');
    players.filter((player) => player.competition.group === groupName).forEach((player) => {
      const item = node('li', '', '');
      item.append(
        node('span', 'luxury-roster-name', player.name.display),
        node('small', 'luxury-roster-meta', player.nationality.name),
      );
      list.append(item);
    });
    group.append(list);
    groups.append(group);
  });
  section.append(groups);
  main.append(section);
}

function updateMetadata(tournament) {
  const title = `${tournament.title} | A Table Tennis Concept`;
  const description = tournament.summary;
  document.title = title;
  [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:image"]', tournament.media.hero.src],
    ['meta[property="og:image:secure_url"]', tournament.media.hero.src],
    ['meta[property="og:image:alt"]', tournament.media.hero.alt],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
    ['meta[name="twitter:image"]', tournament.media.hero.src],
  ].forEach(([selector, content]) => {
    const meta = document.head.querySelector(selector);
    if (meta) meta.content = content;
  });
}

export default async function decorateLuxuryHome(main) {
  if (!['/', '/index', '/index.html'].includes(window.location.pathname)) return;

  const hero = main.querySelector(':scope > div > .hero');
  const cardBlock = main.querySelector(':scope > div > .cards');
  if (!hero || !cardBlock) {
    // eslint-disable-next-line no-console
    console.error('Homepage design requires authored hero and cards blocks.');
    return;
  }

  let tournament;
  let players;
  try {
    ({ tournament, players } = await loadTournament());
  } catch (error) {
    const notice = node('p', 'luxury-data-error', 'The tournament concept could not be loaded. Please try again later.');
    notice.setAttribute('role', 'alert');
    main.prepend(notice);
    // eslint-disable-next-line no-console
    console.error('Structured tournament loading failed', error);
    return;
  }

  if (!decorateHero(hero, tournament)) return;
  document.body.classList.add('luxury-home');
  main.dataset.tournamentTitle = tournament.title;
  main.dataset.tournamentDates = dateRange(tournament.schedule);
  main.dataset.tournamentLocation = `${tournament.venue.location.city}, ${tournament.venue.location.country}`;
  updateMetadata(tournament);
  decorateCards(cardBlock, tournament);
  addContenders(main, players);
}
