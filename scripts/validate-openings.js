// Checks every opening line in src/data/openings.js is legal chess.
import { Chess } from 'chess.js';
import { ALL_LINES, OPENINGS } from '../src/data/openings.js';

let bad = 0;
for (const line of ALL_LINES) {
  const g = new Chess();
  for (let i = 0; i < line.sans.length; i++) {
    try { g.move(line.sans[i]); } catch {
      bad++;
      console.log(`✗ ${line.openingName} — ${line.name}: illegal move #${i + 1} "${line.sans[i]}" after: ${line.sans.slice(0, i).join(' ')}`);
      break;
    }
  }
}
const plies = ALL_LINES.map((l) => l.sans.length);
console.log(`${OPENINGS.length} openings, ${ALL_LINES.length} lines, depth ${Math.min(...plies) / 2}–${Math.max(...plies) / 2} moves. ${bad ? bad + ' broken' : 'All legal ✓'}`);
process.exit(bad ? 1 : 0);
