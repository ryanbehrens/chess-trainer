// Post-game analysis: evaluate every position with Stockfish, then grade each move.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Chess } from 'chess.js';
import { getEngine } from '../engine/engines';
import { scoreValue } from '../engine/Engine';
import { classifyLoss } from '../components/common';
import { loadGames, updateGame } from '../profile/store';

export const ANALYSIS_VERSION = 1;
const DEPTH = 12;
const MOVETIME = 700;
const CAP = 1500; // centipawns: beyond this the game is decided, extra eval swings don't matter

/** Chance of winning (0-100) from the mover's perspective, per lichess's model. */
export const winPct = (cp) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
/** Per-move accuracy from the drop in win chance (lichess formula). */
const moveAccuracy = (before, after) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * Math.max(0, before - after)) - 3.1669));

/**
 * Rough playing-strength estimate from average centipawn loss. Engine-graded ACPL tracks rating well
 * across many games; a single game is noisy, so the progress page averages several.
 */
export function eloFromAcpl(acpl) {
  const elo = 3100 * Math.exp(-0.0098 * acpl);
  return Math.round(Math.max(250, Math.min(2900, elo)) / 25) * 25;
}

const clamp = (v) => Math.max(-CAP, Math.min(CAP, v));
const NON_PAWN = { n: 3, b: 3, r: 5, q: 9 };

function phaseOf(ply, fen) {
  if (ply < 20) return 'opening';
  let mat = 0;
  for (const row of new Chess(fen).board()) for (const p of row) if (p && NON_PAWN[p.type]) mat += NON_PAWN[p.type];
  return mat <= 26 ? 'endgame' : 'middlegame';
}

/** Evaluate and grade a whole game. Returns null if cancelled. */
export async function analyzeGame(sans, { onProgress } = {}) {
  const engine = getEngine('review');
  const g = new Chess();
  const fens = [g.fen()];
  const moves = [];
  for (const s of sans) {
    const m = g.move(s);
    moves.push(m);
    fens.push(g.fen());
  }

  // evals[i]: White-perspective score of position i, plus the engine's best move there.
  const evals = [];
  for (let i = 0; i < fens.length; i++) {
    const pos = new Chess(fens[i]);
    if (pos.isGameOver()) {
      const v = pos.isCheckmate() ? (pos.turn() === 'w' ? -10000 : 10000) : 0;
      evals.push({ v, best: null, mate: pos.isCheckmate() });
    } else {
      const res = await engine.search(fens[i], { depth: DEPTH, movetime: MOVETIME });
      if (!res) return null;
      const line = res.lines[0];
      evals.push({ v: scoreValue(line, pos.turn(), 'w'), best: res.bestmove, mate: line?.mate ?? null, pv: line?.pv?.slice(0, 6) ?? [] });
    }
    onProgress?.((i + 1) / fens.length);
  }

  const graded = moves.map((m, i) => {
    const sign = m.color === 'w' ? 1 : -1;
    const before = clamp(evals[i].v * sign);
    const after = clamp(evals[i + 1].v * sign);
    const uci = m.from + m.to + (m.promotion ?? '');
    const isTop = uci === evals[i].best || (evals[i + 1].mate === true);
    const loss = isTop ? 0 : Math.max(0, before - after);
    const c = classifyLoss(loss, isTop);
    let bestSan = null;
    if (!isTop && evals[i].best) {
      try {
        bestSan = new Chess(fens[i]).move({ from: evals[i].best.slice(0, 2), to: evals[i].best.slice(2, 4), promotion: evals[i].best[4] }).san;
      } catch {
        /* ignore */
      }
    }
    return {
      ply: i,
      san: m.san,
      color: m.color,
      loss: Math.round(loss),
      acc: Math.round(moveAccuracy(winPct(before), winPct(after)) * 10) / 10,
      cls: c.cls,
      best: isTop ? null : evals[i].best,
      bestSan,
      phase: phaseOf(i, fens[i]),
      evalAfter: clamp(evals[i + 1].v),
    };
  });

  const side = (color) => {
    const mine = graded.filter((m) => m.color === color);
    const counts = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    mine.forEach((m) => counts[m.cls]++);
    const avg = (arr, f) => (arr.length ? arr.reduce((s, x) => s + f(x), 0) / arr.length : null);
    const acpl = avg(mine, (m) => Math.min(m.loss, 1000));
    const phases = {};
    for (const ph of ['opening', 'middlegame', 'endgame']) {
      const pm = mine.filter((m) => m.phase === ph);
      phases[ph] = pm.length ? { accuracy: Math.round(avg(pm, (m) => m.acc)), moves: pm.length } : null;
    }
    return {
      moves: mine.length,
      accuracy: mine.length ? Math.round(avg(mine, (m) => m.acc) * 10) / 10 : null,
      acpl: acpl == null ? null : Math.round(acpl),
      estElo: mine.length >= 8 ? eloFromAcpl(acpl) : null, // too few moves to say anything
      counts,
      phases,
    };
  };

  return {
    version: ANALYSIS_VERSION,
    depth: DEPTH,
    evals: evals.map((e) => clamp(e.v)),
    moves: graded,
    w: side('w'),
    b: side('b'),
  };
}

// ── Background queue: one game at a time on the review engine, progress shared with any viewer ──
const progress = new Map(); // gameId -> 0..1
const listeners = new Set();
let version = 0;
let chain = Promise.resolve();
const queued = new Set();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

/** Analyze a saved game (if it isn't already) and store the result on the record. */
export function requestAnalysis(record) {
  if (!record || (record.analysis?.version === ANALYSIS_VERSION) || queued.has(record.id)) return;
  queued.add(record.id);
  progress.set(record.id, 0);
  emit();
  chain = chain.then(async () => {
    try {
      const a = await analyzeGame(record.sans, {
        onProgress: (f) => {
          progress.set(record.id, f);
          emit();
        },
      });
      if (a) updateGame(record.profileId, record.id, { analysis: a });
    } finally {
      queued.delete(record.id);
      progress.delete(record.id);
      emit();
    }
  });
}

/** Live view of a saved game, including its analysis once ready and progress while it runs. */
export function useGameRecord(profileId, gameId) {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  const [, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((v) => v + 1);
    window.addEventListener('games-changed', h);
    return () => window.removeEventListener('games-changed', h);
  }, []);
  const record = gameId ? loadGames(profileId).find((g) => g.id === gameId) ?? null : null;
  return { record, progress: gameId ? progress.get(gameId) ?? null : null };
}
