import { SITE_BASE_URL, SITE_NAME, SITE_SUMMARY, absoluteUrl } from './config';
import { bodyHtml, escapeHtml, pageHtml } from './render-html';
import { routeMarkdown } from './render-markdown';
import { ROUTES, type Route } from './routes';

/**
A file written into the build output next to the game.
*/
export interface SiteFile {
  readonly fileName: string;
  readonly source: string;
}

/**
Crawlers named explicitly as well as matched by `*`: kuhy allows training
crawlers too, so no agent is ever disallowed.
*/
const NAMED_AGENTS = ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended'] as const;

const MIRROR = 'index.md';

/**
URN prefix for AI Catalog identifiers: `urn:air:{publisher}:{namespace}:`.
*/
function catalogUrn(name: string): string {
  return `urn:air:${new URL(SITE_BASE_URL).hostname}:site:${name}`;
}

export function robotsTxt(): string {
  const groups = ['*', ...NAMED_AGENTS].map((agent) => `User-agent: ${agent}\nAllow: /\n`);
  return `${groups.join('\n')}\nSitemap: ${absoluteUrl('sitemap.xml')}\n`;
}

export function sitemapXml(): string {
  const urls = ROUTES.map((route) => `  <url><loc>${escapeHtml(absoluteUrl(route.path))}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export function llmsTxt(): string {
  const pages = ROUTES.map((route) => `- [${route.title}](${absoluteUrl(route.path)}): ${route.description}`);
  const mirrors = ROUTES.map(
    (route) => `- [${route.title} (markdown)](${absoluteUrl(route.path + MIRROR)}): the same page as plain markdown`,
  );
  return [`# ${SITE_NAME}`, '', `> ${SITE_SUMMARY}`, '', '## Pages', ...pages, '', '## Markdown mirrors', ...mirrors, ''].join(
    '\n',
  );
}

export function aiCatalogJson(): string {
  const llms = { identifier: catalogUrn('llms'), displayName: 'llms.txt', type: 'text/plain', url: absoluteUrl('llms.txt') };
  const mirrors = ROUTES.map((route) => ({
    identifier: catalogUrn(`page:${route.path === '' ? 'home' : route.path.replace(/\/$/, '')}`),
    displayName: `${route.title} (markdown)`,
    type: 'text/markdown',
    url: absoluteUrl(route.path + MIRROR),
  }));
  const catalog = {
    specVersion: '1.0',
    host: { displayName: SITE_NAME, identifier: SITE_BASE_URL, documentationUrl: absoluteUrl('how-to-play/') },
    entries: [llms, ...mirrors],
  };
  return `${JSON.stringify(catalog, undefined, 2)}\n`;
}

/**
404 page. A host serves it for any missing path at any depth, so every link
in it is absolute.
*/
export function notFoundHtml(): string {
  const notFound: Route = {
    path: '',
    title: 'Page not found',
    description: 'There is no page at this address.',
    blocks: [
      { kind: 'p', text: `There is no page at this address on the ${SITE_NAME} site. Try one of these instead:` },
      {
        kind: 'links',
        items: ROUTES.map((route) => ({ target: route.path, label: route.title, note: route.description })),
      },
    ],
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Page not found — ${escapeHtml(SITE_NAME)}</title>
<link rel="ai-catalog" href="${absoluteUrl('.well-known/ai-catalog.json')}" type="application/ai-catalog+json">
</head>
<body>
${bodyHtml(notFound, undefined)}
</body>
</html>
`;
}

/**
Every generated file except the game page itself (index.html, which Vite
builds and {@link homeHtml} enriches): one static page per non-home route,
a markdown mirror per route, and the discovery files.
*/
export function siteFiles(): SiteFile[] {
  const pages = ROUTES.filter((route) => route.path !== '').map((route) => ({
    fileName: `${route.path}index.html`,
    source: pageHtml(route),
  }));
  const mirrors = ROUTES.map((route) => ({ fileName: route.path + MIRROR, source: routeMarkdown(route) }));
  return [
    ...pages,
    ...mirrors,
    { fileName: 'robots.txt', source: robotsTxt() },
    { fileName: 'sitemap.xml', source: sitemapXml() },
    { fileName: 'llms.txt', source: llmsTxt() },
    { fileName: '.well-known/ai-catalog.json', source: aiCatalogJson() },
    { fileName: '404.html', source: notFoundHtml() },
  ];
}
