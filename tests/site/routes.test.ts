import { describe, it, expect } from 'vitest';
import { ROUTES, blockText } from '../../src/site/routes';
import { MECHANICS } from '../../src/site/mechanics';
import { SITE_BASE_URL, absoluteUrl } from '../../src/site/config';

describe('site config', () => {
  it('keeps the one base URL at a host root', () => {
    expect(SITE_BASE_URL).toBe('https://iron-and-anvil.kuhy.duckdns.org/');
  });

  it('resolves site paths against the base URL', () => {
    expect(absoluteUrl('')).toBe('https://iron-and-anvil.kuhy.duckdns.org/');
    expect(absoluteUrl('about/')).toBe('https://iron-and-anvil.kuhy.duckdns.org/about/');
    expect(absoluteUrl('.well-known/ai-catalog.json')).toBe(
      'https://iron-and-anvil.kuhy.duckdns.org/.well-known/ai-catalog.json',
    );
  });

  it('passes absolute URLs through unchanged', () => {
    expect(absoluteUrl('https://kuhyx.itch.io/iron-and-anvil')).toBe(
      'https://kuhyx.itch.io/iron-and-anvil',
    );
  });
});

describe('route table', () => {
  it('starts with the game page and has how-to-play and about pages', () => {
    expect(ROUTES.map((route) => route.path)).toEqual(['', 'how-to-play/', 'about/']);
  });

  it('gives every route a title, a description and real text', () => {
    for (const route of ROUTES) {
      expect(route.title.length).toBeGreaterThan(0);
      expect(route.description.length).toBeGreaterThan(20);
      const text = route.blocks.map((block) => blockText(block)).join(' ');
      expect(text.length).toBeGreaterThan(300);
    }
  });

  it('explains the controls of every mechanic on the how-to-play page', () => {
    const howTo = ROUTES.find((route) => route.path === 'how-to-play/');
    const text = howTo?.blocks.map((block) => blockText(block)).join(' ') ?? '';
    for (const mechanic of MECHANICS) {
      expect(text).toContain(mechanic.title);
      for (const control of mechanic.controls) {
        expect(text).toContain(control);
      }
    }
  });

  it('links the homepage to every other page', () => {
    const home = ROUTES[0];
    const targets = home?.blocks.flatMap((block) =>
      block.kind === 'links' ? block.items.map((item) => item.target) : [],
    );
    expect(targets).toEqual(expect.arrayContaining(['how-to-play/', 'about/', 'llms.txt']));
  });
});
