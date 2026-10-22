import { absoluteUrl } from './config';
import type { Block, Route } from './routes';

function blockMarkdown(block: Block): string {
  switch (block.kind) {
    case 'h2': {
      return `## ${block.text}`;
    }
    case 'p': {
      return block.text;
    }
    case 'ul': {
      return block.items.map((item) => `- ${item}`).join('\n');
    }
    case 'links': {
      return block.items
        .map((item) => `- [${item.label}](${absoluteUrl(item.target)}): ${item.note}`)
        .join('\n');
    }
  }
}

/**
Markdown mirror of a route (served as `<route>/index.md`). Links are absolute
because a mirror is often fetched on its own, away from the page it mirrors.
*/
export function routeMarkdown(route: Route): string {
  const parts = [
    `# ${route.title}`,
    `> ${route.description}`,
    ...route.blocks.map((block) => blockMarkdown(block)),
  ];
  return `${parts.join('\n\n')}\n`;
}
