import { SITE_NAME, absoluteUrl } from './config';
import { ROUTES, type Block, type Route, type RoutePath } from './routes';
import { jsonLd } from './structured-data';

const CATALOG_PATH = '.well-known/ai-catalog.json';
const ROOT_MARKER = '<div id="root"></div>';

const PAGE_STYLE =
  ':root{color-scheme:light dark;font:16px/1.5 system-ui,sans-serif}body{margin:0}' +
  'header,main,footer{max-width:960px;margin:0 auto;padding:1rem;box-sizing:border-box}' +
  'nav a{margin-right:1rem}';

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
href for `target` as written on the page at `fromPath`. Site links are
relative, so the same files work at the host root, on
itch.io's CDN path and at a host root. With `fromPath` undefined (a page
served at any depth, like 404.html) site links are absolute instead.
*/
export function hrefFor(target: string, fromPath: RoutePath | undefined): string {
  if (/^[a-z]+:/i.test(target)) {
    return target;
  }
  if (fromPath === undefined) {
    return absoluteUrl(target);
  }
  const depth = fromPath.split('/').filter(Boolean).length;
  return (depth === 0 ? './' : '../'.repeat(depth)) + target;
}

function blockHtml(block: Block, fromPath: RoutePath | undefined): string {
  switch (block.kind) {
    case 'h2': {
      return `<h2>${escapeHtml(block.text)}</h2>`;
    }
    case 'p': {
      return `<p>${escapeHtml(block.text)}</p>`;
    }
    case 'ul': {
      const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    case 'links': {
      const items = block.items.map(
        (item) =>
          `<li><a href="${escapeHtml(hrefFor(item.target, fromPath))}">${escapeHtml(item.label)}</a>: ${escapeHtml(item.note)}</li>`,
      );
      return `<ul>${items.join('')}</ul>`;
    }
  }
}

export function blocksToHtml(blocks: readonly Block[], fromPath: RoutePath | undefined): string {
  return blocks.map((block) => blockHtml(block, fromPath)).join('\n');
}

/**
Head tags every page shares: description, canonical URL, the AI Catalog,
the markdown mirror (`index.md` next to the page) and JSON-LD.
*/
export function headTags(route: Route): string {
  return [
    `<meta name="description" content="${escapeHtml(route.description)}">`,
    `<link rel="canonical" href="${absoluteUrl(route.path)}">`,
    `<link rel="ai-catalog" href="${hrefFor(CATALOG_PATH, route.path)}" type="application/ai-catalog+json">`,
    '<link rel="alternate" type="text/markdown" href="./index.md">',
    `<script type="application/ld+json">${jsonLd(route)}</script>`,
  ].join('\n');
}

function navHtml(fromPath: RoutePath | undefined): string {
  const links = ROUTES.map(
    (route) => `<a href="${escapeHtml(hrefFor(route.path, fromPath))}">${escapeHtml(route.path === '' ? 'Play' : route.title)}</a>`,
  );
  return `<nav aria-label="Site">${links.join('')}</nav>`;
}

/**
Body of a static page: site nav, the page's own content and a footer.
*/
export function bodyHtml(route: Route, fromPath: RoutePath | undefined): string {
  return [
    `<header><strong>${escapeHtml(SITE_NAME)}</strong>${navHtml(fromPath)}</header>`,
    `<main><h1>${escapeHtml(route.title)}</h1>\n${blocksToHtml(route.blocks, fromPath)}</main>`,
    `<footer><a href="${escapeHtml(hrefFor('llms.txt', fromPath))}">llms.txt</a></footer>`,
  ].join('\n');
}

/**
A complete static HTML page with no JavaScript bundle: the content is all in
the initial HTML. Used for every route except the game page itself.
*/
export function pageHtml(route: Route): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(route.title)} — ${escapeHtml(SITE_NAME)}</title>
${headTags(route)}
<style>${PAGE_STYLE}</style>
</head>
<body>
${bodyHtml(route, route.path)}
</body>
</html>
`;
}

/**
The game page: Vite's index.html with the head tags added and the homepage
content placed inside `#root`. React replaces that content when the game
mounts, so players see the game unchanged while agents without JavaScript
read the text.
*/
export function homeHtml(indexHtml: string): string {
  if (!indexHtml.includes('</head>')) {
    throw new Error('index.html has no </head> to add the agent-ready tags to');
  }
  if (!indexHtml.includes(ROOT_MARKER)) {
    throw new Error(`index.html has no empty ${ROOT_MARKER} for the static content`);
  }
  const home = ROUTES[0] as Route;
  return indexHtml
    .replace('</head>', () => `${headTags(home)}\n</head>`)
    .replace(ROOT_MARKER, () => `<div id="root">\n${bodyHtml(home, home.path)}\n</div>`);
}
