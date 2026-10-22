import { AUTHOR_NAME, ITCH_URL, SITE_NAME, SITE_SUMMARY, SOURCE_URL, absoluteUrl } from './config';
import type { Route } from './routes';

function videoGame(): Record<string, unknown> {
  return {
    '@type': 'VideoGame',
    name: SITE_NAME,
    description: SITE_SUMMARY,
    url: absoluteUrl(''),
    genre: ['Crafting', 'Simulation'],
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    playMode: 'SinglePlayer',
    isAccessibleForFree: true,
    inLanguage: 'en',
    author: { '@type': 'Person', name: AUTHOR_NAME },
    sameAs: [ITCH_URL, SOURCE_URL],
  };
}

/**
JSON-LD for a route: the homepage is the game itself (VideoGame), every
other page is a WebPage about it. `<` is escaped so the JSON can never close
the `<script>` element it is embedded in.
*/
export function jsonLd(route: Route): string {
  const data =
    route.path === ''
      ? { '@context': 'https://schema.org', ...videoGame() }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${route.title} — ${SITE_NAME}`,
          description: route.description,
          url: absoluteUrl(route.path),
          about: videoGame(),
        };
  return JSON.stringify(data).replaceAll('<', String.raw`\u003c`);
}
