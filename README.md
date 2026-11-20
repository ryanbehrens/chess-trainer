# Chess Trainer

Local chess app for learning: play Stockfish, get best-move coaching, and drill openings.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Tabs
- **Play vs Bot**: Stockfish 19 (WASM, runs in your browser) at 8 strength levels, from ~600 up to full strength. Has take-back, hints, and a "Review in Coach" button.
- **Best-Move Coach**: you play one side. The engine shows its top 3 moves with arrows, evals and lines, and grades every move you make (Best / Excellent / Good / Inaccuracy / Mistake / Blunder / Book). The opponent can follow opening theory and then switch to Stockfish, play Stockfish from move 1, or be you (analysis mode). Turn off "Show best moves" to guess before you look.
- **Openings**: 25 openings and 77 lines, each 8–16 moves deep. **Study** steps through a line with an explanation of the plan. **Drill** has you play your side from memory; progress is saved in your browser, and a line counts as mastered after 3 perfect runs.

## Adding openings
Edit `src/data/openings.js` (lines are plain SAN strings), then run `npm run test:openings` to check every move is legal.
