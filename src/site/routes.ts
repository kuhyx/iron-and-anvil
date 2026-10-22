import { ACOUP_URL, ITCH_URL, SITE_NAME, SITE_SUMMARY, SOURCE_URL } from './config';
import { MECHANICS } from './mechanics';

/**
A link inside page content. `target` is a site path relative to the base
(`'about/'`, `'llms.txt'`) or an absolute external URL.
*/
export interface ContentLink {
  readonly target: string;
  readonly label: string;
  readonly note: string;
}

export type Block =
  | { readonly kind: 'h2'; readonly text: string }
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'ul'; readonly items: readonly string[] }
  | { readonly kind: 'links'; readonly items: readonly ContentLink[] };

export type RoutePath = '' | 'how-to-play/' | 'about/';

/**
One public page. This table is the single source of truth for every route:
the HTML pages, markdown mirrors, sitemap, llms.txt and AI Catalog are all
generated from it.
*/
export interface Route {
  readonly path: RoutePath;
  readonly title: string;
  readonly description: string;
  readonly blocks: readonly Block[];
}

/**
Visible text of a block, as an agent without JavaScript would read it.
*/
export function blockText(block: Block): string {
  switch (block.kind) {
    case 'h2':
    case 'p': {
      return block.text;
    }
    case 'ul': {
      return block.items.join(' ');
    }
    case 'links': {
      return block.items.map((item) => `${item.label}: ${item.note}`).join(' ');
    }
  }
}

const PAGE_LINKS: Block = {
  kind: 'links',
  items: [
    { target: 'how-to-play/', label: 'How to play', note: 'goal, heat colours, scoring and the controls of every mini-game' },
    { target: 'about/', label: 'About', note: 'what the game is, why it exists and who made it' },
    { target: 'llms.txt', label: 'llms.txt', note: 'a short index of this site for AI agents' },
    { target: ITCH_URL, label: 'Iron and Anvil on itch.io', note: 'the same game, hosted on itch.io' },
  ],
};

const HOME: Route = {
  path: '',
  title: SITE_NAME,
  description: SITE_SUMMARY,
  blocks: [
    { kind: 'p', text: SITE_SUMMARY },
    {
      kind: 'p',
      text: 'This page is the game itself: it starts in your browser as soon as JavaScript loads. Pick one of four smithing mini-games from the menu. All four work the same bar of hot iron, so you can compare which way of smithing feels best.',
    },
    { kind: 'h2', text: 'The four mini-games' },
    { kind: 'ul', items: MECHANICS.map((mechanic) => `${mechanic.title}: ${mechanic.description}`) },
    { kind: 'h2', text: 'More about the game' },
    PAGE_LINKS,
  ],
};

const HOW_TO_PLAY: Route = {
  path: 'how-to-play/',
  title: 'How to play',
  description: 'How to play Iron and Anvil: the goal, reading the heat of the metal, scoring, and the controls of all four smithing mini-games.',
  blocks: [
    { kind: 'h2', text: 'Goal' },
    {
      kind: 'p',
      text: 'Forge a bar of iron into shape. Shape progress raises your score and every mistake adds a flaw. The final score is shape minus flaws, from 0 to 100, graded ruined (under 20), flawed (under 50), sound (under 85) or fine.',
    },
    { kind: 'h2', text: 'Reading the heat' },
    {
      kind: 'p',
      text: 'Like a real smith, you judge temperature by colour. Below about 550 °C the metal is black and too cold to shape. It then glows red, orange, yellow and finally white. Above 1500 °C it burns, which ruins the piece. Heat it, work it while it glows, and reheat it before it goes black.',
    },
    ...MECHANICS.flatMap((mechanic): Block[] => [
      { kind: 'h2', text: mechanic.title },
      { kind: 'p', text: mechanic.description },
      { kind: 'ul', items: mechanic.controls },
    ]),
    { kind: 'h2', text: 'Finishing a piece' },
    {
      kind: 'p',
      text: 'When a piece is done the game shows its score and grade. Press Try Again to forge another bar with the same mini-game, or Back to Menu to try a different one.',
    },
    { kind: 'links', items: [{ target: '', label: 'Play Iron and Anvil', note: 'start the game in your browser' }] },
  ],
};

const ABOUT: Route = {
  path: 'about/',
  title: 'About',
  description: 'About Iron and Anvil: a medieval blacksmithing browser game and mechanic bake-off inspired by the ACOUP series on how iron was made.',
  blocks: [
    {
      kind: 'p',
      text: 'Iron and Anvil is a medieval blacksmithing game inspired by Bret Devereaux\'s ACOUP series "Iron: How Did They Make It". It aims to show what forging iron by hand actually involved: managing the fire, judging heat by eye, and shaping the metal before it cools.',
    },
    { kind: 'h2', text: 'A mechanic bake-off' },
    {
      kind: 'p',
      text: 'This version is a prototype. It offers four different ways to express the act of smithing: a sweet-spot strike, shape sculpting, meter juggling and turn-based resolution. All four act on the same workpiece and use the same scoring, so they can be compared side by side before one is chosen for the full game.',
    },
    { kind: 'h2', text: 'Facts' },
    {
      kind: 'ul',
      items: [
        'Genre: crafting and simulation, single player.',
        'Platform: any modern web browser, desktop or mobile. Nothing to install.',
        'Price: free.',
        'Built with TypeScript and React.',
        'Made by kuhy.',
      ],
    },
    { kind: 'h2', text: 'Links' },
    {
      kind: 'links',
      items: [
        { target: '', label: 'Play Iron and Anvil', note: 'the game, in your browser' },
        { target: 'how-to-play/', label: 'How to play', note: 'controls and scoring' },
        { target: ACOUP_URL, label: 'ACOUP: Iron, How Did They Make It', note: 'the history series that inspired the game' },
        { target: SOURCE_URL, label: 'Source code', note: 'the game on GitHub' },
        { target: ITCH_URL, label: 'itch.io page', note: 'the game on itch.io' },
      ],
    },
  ],
};

export const ROUTES: readonly Route[] = [HOME, HOW_TO_PLAY, ABOUT];
