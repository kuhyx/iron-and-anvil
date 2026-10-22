import { describe, it, expect, vi, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';

afterEach(() => {
  vi.resetModules();
  document.body.replaceChildren();
});

describe('main bootstrap', () => {
  it('throws when there is no #root element', async () => {
    document.body.replaceChildren();
    await expect(import('../../src/main')).rejects.toThrow('Missing #root element');
  });

  it('mounts the app into #root', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);

    await import('../../src/main');

    await waitFor(() => {
      expect(root.textContent).toContain('Iron and Anvil');
    });
  });

  it('replaces the static no-JS content in #root with the game', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    root.innerHTML = '<main><h1>Iron and Anvil</h1><p>static no-JS page text</p></main>';
    document.body.append(root);

    await import('../../src/main');

    await waitFor(() => {
      expect(root.querySelector('button')).not.toBeNull();
    });
    expect(root.textContent).not.toContain('static no-JS page text');
  });
});
