# Iron and Anvil

A medieval blacksmithing game inspired by ACOUP's
["Iron: How Did They Make It"](https://acoup.blog/2020/09/18/collections-iron-how-did-they-make-it-part-i-mining/)
series.

This prototype is a **mechanic bake-off**: four different mini-games for
expressing the act of smithing (sweet-spot strike, shape-sculpting, meter
juggling, turn-based resolution), all acting on the same hot workpiece, so
they can be compared side by side before committing to one for the full game.

## Run it

```sh
./install.sh   # first time only: installs Node deps
./run.sh       # builds and opens the game in a browser
```

## Develop

```sh
pnpm install
pnpm run dev        # dev server with HMR
pnpm run check       # lint + typecheck + tests with 100% coverage
```

## Layout

- `src/engine/` — shared, framework-free logic (clock, heat, quality scoring).
- `src/mechanics/` — the four independent mini-game logic modules.
- `src/ui/` — React screens and rendering for each mechanic.
- `tests/` — mirrors `src/`, one test file per module.
