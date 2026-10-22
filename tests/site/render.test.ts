import { describe, it, expect } from 'vitest';
import { escapeHtml, hrefFor, blocksToHtml, pageHtml, homeHtml, headTags } from '../../src/site/render-html';
import { routeMarkdown } from '../../src/site/render-markdown';
import { jsonLd } from '../../src/site/structured-data';
import { ROUTES, type Route } from '../../src/site/routes';

const home = ROUTES[0] as Route;
const about = ROUTES[2] as Route;

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
});

describe('hrefFor', () => {
  it('links relative to the page so the itch.io CDN path works too', () => {
    expect(hrefFor('about/', '')).toBe('./about/');
    expect(hrefFor('', 'about/')).toBe('../');
    expect(hrefFor('llms.txt', 'how-to-play/')).toBe('../llms.txt');
  });

  it('uses absolute URLs when the page can be served at any depth', () => {
    expect(hrefFor('about/', undefined)).toBe('https://iron-and-anvil.kuhy.duckdns.org/about/');
  });

  it('leaves external URLs alone', () => {
    expect(hrefFor('https://kuhyx.itch.io/iron-and-anvil', '')).toBe('https://kuhyx.itch.io/iron-and-anvil');
  });
});

describe('blocksToHtml', () => {
  it('renders every block kind', () => {
    const html = blocksToHtml(
      [
        { kind: 'h2', text: 'Head' },
        { kind: 'p', text: 'Para & more' },
        { kind: 'ul', items: ['one', 'two'] },
        { kind: 'links', items: [{ target: 'about/', label: 'About', note: 'who' }] },
      ],
      '',
    );
    expect(html).toContain('<h2>Head</h2>');
    expect(html).toContain('<p>Para &amp; more</p>');
    expect(html).toContain('<li>one</li><li>two</li>');
    expect(html).toContain('<li><a href="./about/">About</a>: who</li>');
  });
});

describe('headTags', () => {
  it('advertises the catalog, the markdown mirror, canonical URL and JSON-LD', () => {
    const tags = headTags(about);
    expect(tags).toContain('<link rel="ai-catalog" href="../.well-known/ai-catalog.json" type="application/ai-catalog+json">');
    expect(tags).toContain('<link rel="alternate" type="text/markdown" href="./index.md">');
    expect(tags).toContain('<link rel="canonical" href="https://iron-and-anvil.kuhy.duckdns.org/about/">');
    expect(tags).toContain('<script type="application/ld+json">');
  });
});

describe('pageHtml', () => {
  it('renders a full static page with no scripts besides JSON-LD', () => {
    const html = pageHtml(about);
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain(`<title>${about.title} — Iron and Anvil</title>`);
    expect(html).toContain('<a href="../">');
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/);
  });
});

describe('homeHtml', () => {
  const shell = '<html><head><title>x</title></head><body><div id="root"></div><script type="module" src="/m.js"></script></body></html>';

  it('injects head tags and the no-JS content into #root', () => {
    const html = homeHtml(shell);
    expect(html).toContain('<link rel="ai-catalog" href="./.well-known/ai-catalog.json"');
    expect(html).toContain('<a href="./how-to-play/">');
    expect(html).toContain('<script type="module" src="/m.js"></script>');
    expect(html.indexOf('<a href="./how-to-play/">')).toBeGreaterThan(html.indexOf('<div id="root">'));
  });

  it('does not put buttons in the static markup (the smoke test waits on #root button)', () => {
    expect(homeHtml(shell)).not.toContain('<button');
  });

  it('fails loudly when the shell lacks its markers', () => {
    expect(() => homeHtml('<html></html>')).toThrow(/<\/head>/);
    expect(() => homeHtml('<head></head><body></body>')).toThrow(/root/);
  });
});

describe('routeMarkdown', () => {
  it('mirrors the page with a title, prose, lists and absolute links', () => {
    const md = routeMarkdown(home);
    expect(md).toMatch(/^# Iron and Anvil\n/);
    expect(md).toContain(`> ${home.description}`);
    expect(md).toContain('- [How to play](https://iron-and-anvil.kuhy.duckdns.org/how-to-play/)');
    expect(md).not.toContain('```');
  });

  it('renders headings and plain lists', () => {
    const md = routeMarkdown(ROUTES[1] as Route);
    expect(md).toContain('\n## ');
    expect(md).toMatch(/\n- [^[]/);
  });
});

describe('jsonLd', () => {
  it('describes the game as a VideoGame on the homepage', () => {
    const data = JSON.parse(jsonLd(home)) as Record<string, unknown>;
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('VideoGame');
    expect(data['url']).toBe('https://iron-and-anvil.kuhy.duckdns.org/');
  });

  it('describes other pages as WebPages about the game', () => {
    const data = JSON.parse(jsonLd(about)) as Record<string, unknown>;
    expect(data['@type']).toBe('WebPage');
    expect(data['about']).toMatchObject({ '@type': 'VideoGame' });
  });

  it('escapes < so the JSON cannot close its script element', () => {
    const hostile: Route = { ...about, description: '</script><b>' };
    const raw = jsonLd(hostile);
    expect(raw).not.toContain('<');
    expect((JSON.parse(raw) as { description: string }).description).toBe('</script><b>');
  });
});
