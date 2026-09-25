function parseStructuredContent(html, schemaName) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const references = new Map();
  document.querySelectorAll('div[class]').forEach((block) => {
    const [kind, reference] = block.classList;
    if (reference?.startsWith(`${kind}-`)) {
      if (references.has(reference)) throw new Error(`Duplicate structured block ${reference}`);
      references.set(reference, block);
    }
  });

  function parseBlock(block, ancestors = new Set()) {
    function parseValue(text) {
      if (!text.startsWith('self://#')) return text;
      const reference = text.slice('self://#'.length);
      const target = references.get(reference);
      if (!target) throw new Error(`Missing structured block ${reference}`);
      if (ancestors.has(reference)) throw new Error(`Cyclic structured block ${reference}`);
      return parseBlock(target, new Set([...ancestors, reference]));
    }

    const fields = {};
    [...block.children].forEach((row) => {
      const [label, value] = row.children;
      const key = label?.querySelector('h3')?.textContent.trim();
      if (!key || !value || row.children.length !== 2) {
        throw new Error(`Invalid structured row in ${schemaName}`);
      }
      if (Object.hasOwn(fields, key)) throw new Error(`Duplicate structured field ${key}`);
      const list = value.querySelector(':scope > ul');
      fields[key] = list
        ? [...list.children].map((item) => parseValue(item.textContent.trim()))
        : parseValue(value.textContent.trim());
    });
    return fields;
  }

  const metadata = document.querySelector('.da-form');
  if (!metadata || parseBlock(metadata)['x-schema-name'] !== schemaName) {
    throw new Error(`Expected ${schemaName} structured content`);
  }
  const root = document.querySelector(`.${schemaName}`);
  if (!root) throw new Error(`Missing ${schemaName} structured block`);
  return parseBlock(root);
}

export async function readStructuredContent(path, schemaName) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  return parseStructuredContent(await response.text(), schemaName);
}

function requireImage(image, label) {
  if (
    !image?.src?.startsWith('https://images.unsplash.com/')
    || !image.alt
    || !image.credit?.name
    || !image.credit.url?.startsWith('https://unsplash.com/photos/')
    || image.licenseUrl !== 'https://unsplash.com/license'
  ) {
    throw new Error(`Invalid credited image in ${label}`);
  }
  return image;
}

export function normalizeTournament(record) {
  const year = Number(record.year);
  if (record.status !== 'Concept' || record.entrants?.length !== 6
    || !Number.isInteger(year) || year < 2000) {
    throw new Error('Expected a six-player concept tournament');
  }
  if (!record.name || !record.summary || !record.schedule?.startDate
    || !record.schedule.endDate || !record.venue?.location?.city
    || !record.experience?.description) {
    throw new Error('Tournament is missing required details');
  }
  if (record.highlights?.length !== 4 || record.media?.gallery?.length !== 4) {
    throw new Error('Tournament requires four highlights and images');
  }

  const imageKeys = new Set();
  const images = Object.fromEntries(record.media.gallery.map((image) => {
    if (imageKeys.has(image.key)) throw new Error(`Duplicate highlight image ${image.key}`);
    imageKeys.add(image.key);
    return [image.key, requireImage(image, image.key)];
  }));
  const expectedKeys = ['schedule', 'players', 'venue', 'tickets'];
  if (expectedKeys.some((key) => !imageKeys.has(key))
    || expectedKeys.some((key) => !record.highlights.find((highlight) => highlight.key === key))) {
    throw new Error('Tournament highlights and images do not match');
  }

  const entrants = record.entrants.map(({ playerPath, seed, group }) => {
    if (!/^\/players\/[a-z]+(?:-[a-z]+)+$/.test(playerPath)
      || !Number.isInteger(Number(seed)) || !['A', 'B'].includes(group)) {
      throw new Error(`Invalid tournament entry ${playerPath}`);
    }
    return { player: playerPath, seed: Number(seed), group };
  });
  if (new Set(entrants.map(({ player }) => player)).size !== 6
    || new Set(entrants.map(({ seed }) => seed)).size !== 6
    || entrants.filter(({ group }) => group === 'A').length !== 3
    || entrants.filter(({ group }) => group === 'B').length !== 3) {
    throw new Error('Tournament requires distinct players and seeds in two groups of three');
  }

  return {
    title: record.name,
    year,
    summary: record.summary,
    schedule: record.schedule,
    venue: record.venue,
    experience: record.experience,
    entrants,
    highlights: record.highlights,
    media: {
      hero: requireImage(record.media.heroImage, 'hero'),
      highlights: images,
    },
  };
}

export function normalizePlayer(record, entrant) {
  const seed = Number(record.competition?.seed);
  const age = Number(record.age);
  const ranking = Number(record.ranking);
  if (!record.name || !record.nationality || !record.playingStyle?.styleType
    || seed !== entrant.seed || record.competition.group !== entrant.group
    || !Number.isInteger(age) || age < 16 || !Number.isInteger(ranking) || ranking < 1
    || !record.equipment?.blade || !record.equipment.forehandRubber
    || !record.equipment.backhandRubber) {
    throw new Error(`Incomplete structured player ${entrant.player}`);
  }
  requireImage(record.media?.profileImage, entrant.player);
  return {
    name: { display: record.name },
    nationality: { name: record.nationality },
    profile: { playingStyle: { archetype: record.playingStyle.styleType } },
    competition: { seed, group: record.competition.group },
    ranking,
    age,
    equipment: record.equipment,
  };
}
