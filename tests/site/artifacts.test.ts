import { describe, it, expect } from 'vitest';
import { robotsTxt, sitemapXml, llmsTxt, aiCatalogJson, notFoundHtml, siteFiles } from '../../src/site/artifacts';
import { ROUTES } from '../../src/site/routes';

const BASE = 'https://iron-and-anvil.kuhy.duckdns.org/';

describe('robotsTxt', () => {
  it('allows every agent, training crawlers included, and points at the sitemap', () => {
    const robots = robotsTxt();
    expect(robots).toMatch(/^User-agent: \*\nAllow: \/\n/);
    for (const bot of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended']) {
      expect(robots).toContain(`User-agent: ${bot}\nAllow: /\n`);
    }
    expect(robots).not.toContain('Disallow');
    expect(robots).toContain(`Sitemap: ${BASE}sitemap.xml\n`);
  });
});

describe('sitemapXml', () => {
  it('lists every route as an absolute URL', () => {
    const xml = sitemapXml();
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    for (const route of ROUTES) {
      expect(xml).toContain(`<loc>${BASE}${route.path}</loc>`);
    }
  });
});

describe('llmsTxt', () => {
  it('has an H1, a summary and a link list of every page', () => {
    const lines = llmsTxt().split('\n');
    expect(lines[0]).toBe('# Iron and Anvil');
    expect(lines[1]).toBe('');
    expect(lines[2]).toMatch(/^> \S/);
    expect(lines).toContain('## Pages');
    for (const route of ROUTES) {
      expect(lines.some((line) => line.startsWith(`- [${route.title}](${BASE}${route.path}): `))).toBe(true);
    }
  });
});

describe('aiCatalogJson', () => {
  it('is a valid AI Catalog that lists llms.txt and every mirror', () => {
    const catalog = JSON.parse(aiCatalogJson()) as {
      specVersion: string;
      host: { displayName: string };
      entries: { identifier: string; type: string; url: string }[];
    };
    expect(catalog.specVersion).toBe('1.0');
    expect(catalog.host.displayName).toBe('Iron and Anvil');
    const urls = catalog.entries.map((entry) => entry.url);
    expect(urls).toContain(`${BASE}llms.txt`);
    for (const route of ROUTES) {
      expect(urls).toContain(`${BASE}${route.path}index.md`);
    }
    for (const entry of catalog.entries) {
      expect(entry.identifier).toMatch(/^urn:air:iron-and-anvil\.kuhy\.duckdns\.org:site:/);
      expect(entry.type).toMatch(/^text\//);
    }
  });
});

describe('notFoundHtml', () => {
  it('has real text and absolute links, since it is served at any depth', () => {
    const html = notFoundHtml();
    expect(html).toContain('Page not found');
    expect(html).toContain(`<a href="${BASE}">`);
    expect(html).toContain(`<a href="${BASE}how-to-play/">`);
  });
});

describe('siteFiles', () => {
  it('emits an HTML page for every non-home route and a mirror for every route', () => {
    const names = siteFiles().map((file) => file.fileName);
    expect(names).toEqual([
      'how-to-play/index.html',
      'about/index.html',
      'index.md',
      'how-to-play/index.md',
      'about/index.md',
      'robots.txt',
      'sitemap.xml',
      'llms.txt',
      '.well-known/ai-catalog.json',
      '404.html',
    ]);
    for (const file of siteFiles()) {
      expect(file.source.length).toBeGreaterThan(50);
    }
  });
});
