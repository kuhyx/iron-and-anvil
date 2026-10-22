import { describe, it, expect, vi } from 'vitest';
import { agentReadyPlugin } from '../../src/site/vite-plugin';
import { siteFiles } from '../../src/site/artifacts';

describe('agentReadyPlugin', () => {
  it('rewrites index.html after Vite has processed it', () => {
    const plugin = agentReadyPlugin();
    const hook = plugin.transformIndexHtml;
    expect(hook.order).toBe('post');
    const html = hook.handler('<head></head><body><div id="root"></div></body>');
    expect(html).toContain('rel="ai-catalog"');
  });

  it('emits every generated site file into the bundle', () => {
    const emitFile = vi.fn();
    agentReadyPlugin().generateBundle.call({ emitFile });
    expect(emitFile.mock.calls.map(([file]) => (file as { fileName: string }).fileName)).toEqual(
      siteFiles().map((file) => file.fileName),
    );
    expect(emitFile).toHaveBeenCalledWith(expect.objectContaining({ type: 'asset', fileName: 'robots.txt' }));
  });
});
