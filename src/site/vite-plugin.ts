import { siteFiles } from './artifacts';
import { homeHtml } from './render-html';

interface EmitContext {
  emitFile: (file: { type: 'asset'; fileName: string; source: string }) => unknown;
}

/**
Vite plugin that makes the build agent-ready: enriches the game page and
writes the static pages, markdown mirrors and discovery files next to it.
Typed structurally (not as Vite's `Plugin`) so it stays a plain, testable
object; vite.config.ts passes it straight to `plugins`.
*/
export function agentReadyPlugin() {
  return {
    name: 'agent-ready-site',
    // 'post': after Vite rewrites asset URLs, so it never touches our links.
    transformIndexHtml: { order: 'post' as const, handler: (html: string) => homeHtml(html) },
    generateBundle(this: EmitContext) {
      for (const file of siteFiles()) {
        this.emitFile({ type: 'asset', fileName: file.fileName, source: file.source });
      }
    },
  };
}
