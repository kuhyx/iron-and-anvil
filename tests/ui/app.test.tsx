import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/app';

describe('App', () => {
  it('renders the bake-off heading and the mode menu', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Iron and Anvil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sweet-Spot Strike/ })).toBeInTheDocument();
  });

  it('navigates into a mechanic, finishes it, and returns to the menu', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Turn-Based Resolution/ }));
    expect(screen.getByRole('heading', { name: 'Turn-Based Resolution' })).toBeInTheDocument();

    for (let turn = 0; turn < 40; turn += 1) {
      const action = turn % 2 === 0 ? 'Heat' : 'Strike';
      const button = screen.queryByRole('button', { name: action });
      if (!button) {
        break;
      }
      fireEvent.click(button);
    }
    expect(screen.getByTestId('result')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Menu' }));
    expect(screen.getByRole('button', { name: /Sweet-Spot Strike/ })).toBeInTheDocument();
  });

  it('renders each of the other three mechanics when chosen from the menu', () => {
    const cases: readonly [RegExp, string][] = [
      [/Sweet-Spot Strike/, 'Sweet-Spot Strike'],
      [/Shape Sculpting/, 'Shape Sculpting'],
      [/Meter Juggling/, 'Meter Juggling'],
    ];

    for (const [menuLabel, heading] of cases) {
      const { unmount } = render(<App />);
      fireEvent.click(screen.getByRole('button', { name: menuLabel }));
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
      unmount();
    }
  });
});
