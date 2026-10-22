/**
The one canonical origin of the public site. Every absolute URL in robots.txt,
sitemap.xml, llms.txt, the AI Catalog, canonical tags and JSON-LD derives from
it. The site is not deployed yet; this is its planned host-root origin (the
AgentReady checker needs robots.txt, llms.txt and /.well-known/ at the host
root, which a GitHub Pages sub-path cannot provide). Keep the trailing `/`.
*/
export const SITE_BASE_URL = 'https://iron-and-anvil.kuhy.duckdns.org/';

export const SITE_NAME = 'Iron and Anvil';

export const SITE_SUMMARY =
  'Iron and Anvil is a free browser game about medieval blacksmithing: heat a bar of iron in the forge and hammer it into shape before it cools or burns.';

export const ITCH_URL = 'https://kuhyx.itch.io/iron-and-anvil';
export const SOURCE_URL = 'https://github.com/kuhyx/iron-and-anvil';
export const ACOUP_URL = 'https://acoup.blog/2020/09/18/collections-iron-how-did-they-make-it-part-i-mining/';
export const AUTHOR_NAME = 'kuhy';

/**
Absolute URL for a site path relative to {@link SITE_BASE_URL} (`''`,
`'about/'`, `'llms.txt'`). Absolute URLs pass through unchanged.
*/
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_BASE_URL).href;
}
