import { Chess } from 'chess.js';
import { scoreValue } from '../engine/Engine';

/** Replay a list of SAN moves from the start position. */
export function replay(sans) {
  const g = new Chess();
  for (const s of sans) g.move(s);
  return g;
}

/** Convert a UCI move list (e2e4 ...) to SAN, stopping at the first illegal move. */
export function uciToSan(fen, ucis, limit = 99) {
  const g = new Chess(fen);
  const out = [];
  for (const u of ucis.slice(0, limit)) {
    try {
      const m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

/** Format SAN list with move numbers, starting at a given ply. */
export function numbered(sans, startPly = 0) {
  return sans
    .map((s, i) => {
      const ply = startPly + i;
      if (ply % 2 === 0) return `${ply / 2 + 1}.${s}`;
      return i === 0 ? `${Math.floor(ply / 2) + 1}…${s}` : s;
    })
    .join(' ');
}

export function gameResult(g) {
  if (g.isCheckmate()) return `Checkmate — ${g.turn() === 'w' ? 'Black' : 'White'} wins`;
  if (g.isStalemate()) return 'Draw by stalemate';
  if (g.isThreefoldRepetition()) return 'Draw by repetition';
  if (g.isInsufficientMaterial()) return 'Draw — insufficient material';
  if (g.isDraw()) return 'Draw (50-move rule)';
  return null;
}

export function EvalBar({ line, turn, orientation }) {
  // White-perspective centipawns, squashed to 0..1 for bar height.
  const v = line ? scoreValue(line, turn, 'w') : 0;
  const pct = 1 / (1 + Math.exp(-v / 350));
  const label = !line
    ? ''
    : line.mate != null
      ? `M${Math.abs(line.mate)}`
      : (Math.abs(v) / 100).toFixed(1);
  const whiteOnBottom = orientation === 'white';
  return (
    <div className={`eval-bar ${whiteOnBottom ? '' : 'flipped'}`} title="Engine evaluation">
      <div className="eval-white" style={{ height: `${pct * 100}%` }} />
      <span className={`eval-label ${v >= 0 ? 'w' : 'b'}`}>{label}</span>
    </div>
  );
}

export function MoveList({ sans, current = sans.length, onJump, annotations = {} }) {
  const rows = [];
  for (let i = 0; i < sans.length; i += 2) rows.push(i);
  return (
    <div className="move-list">
      {rows.length === 0 && <div className="muted">No moves yet.</div>}
      {rows.map((i) => (
        <div className="move-row" key={i}>
          <span className="move-no">{i / 2 + 1}.</span>
          {[i, i + 1].map((p) =>
            sans[p] ? (
              <button
                key={p}
                className={`move ${p === current - 1 ? 'active' : ''}`}
                onClick={() => onJump?.(p + 1)}
              >
                {sans[p]}
                {annotations[p] && <span className={`tag ${annotations[p].cls}`}>{annotations[p].sym}</span>}
              </button>
            ) : (
              <span key={p} />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** Classify a move by centipawn loss (from the mover's perspective). */
export function classifyLoss(loss, isTop) {
  // "Best move" only for the engine's actual #1 choice, so the label never contradicts "the #1 was X".
  if (isTop) return { label: 'Best move', sym: '★', cls: 'best' };
  if (loss <= 20) return { label: 'Excellent', sym: '!', cls: 'excellent' };
  if (loss <= 60) return { label: 'Good', sym: '✓', cls: 'good' };
  if (loss <= 120) return { label: 'Inaccuracy', sym: '?!', cls: 'inaccuracy' };
  if (loss <= 250) return { label: 'Mistake', sym: '?', cls: 'mistake' };
  return { label: 'Blunder', sym: '??', cls: 'blunder' };
}

export function lastMoveOf(g) {
  const h = g.history({ verbose: true });
  const m = h[h.length - 1];
  return m ? { from: m.from, to: m.to } : null;
}

// ── Material count ──
export const PIECE_POINTS = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const START_COUNT = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const GLYPH = { p: '♟\uFE0E', n: '♞', b: '♝', r: '♜', q: '♛' }; // solid glyphs, colored by CSS
const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' };

/** Pieces each side has captured, and material points for each side. */
export function materialOf(g) {
  const count = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  for (const row of g.board()) for (const sq of row) if (sq && sq.type !== 'k') count[sq.color][sq.type]++;
  const points = { w: 0, b: 0 };
  const captured = { w: [], b: [] }; // captured.w = black pieces White has taken
  for (const c of ['w', 'b']) {
    const opp = c === 'w' ? 'b' : 'w';
    for (const t of ['q', 'r', 'b', 'n', 'p']) {
      points[c] += count[c][t] * PIECE_POINTS[t];
      for (let i = count[opp][t]; i < START_COUNT[t]; i++) captured[c].push(t);
    }
  }
  return { captured, points, diff: points.w - points.b, count };
}

/** Plain-English summary like "up a knight and a pawn" from `color`'s side. */
export function materialSummary(m, color) {
  const opp = color === 'w' ? 'b' : 'w';
  const extra = [];
  for (const t of ['q', 'r', 'b', 'n', 'p']) {
    const d = m.count[color][t] - m.count[opp][t];
    if (d > 0) extra.push(d === 1 ? `a ${NAMES[t]}` : `${d} ${NAMES[t]}s`);
  }
  return extra;
}

/** Row of captured pieces with +N advantage, for one side. */
export function CapturedRow({ m, color }) {
  const opp = color === 'w' ? 'b' : 'w';
  const adv = color === 'w' ? m.diff : -m.diff;
  const taken = m.captured[color];
  const pts = taken.reduce((s, t) => s + PIECE_POINTS[t], 0);
  return (
    <span className="captured" title={`Captured ${pts} point${pts === 1 ? '' : 's'} of material`}>
      {taken.map((t, i) => (
        <span key={i} className={`cap side-${opp} ${taken[i - 1] !== t && i ? 'gap' : ''}`}>{GLYPH[t]}</span>
      ))}
      {adv > 0 && <b className="adv">+{adv}</b>}
    </span>
  );
}
