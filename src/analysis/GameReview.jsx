import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Board from '../components/Board';
import { MoveList, replay } from '../components/common';
import { EvalGraph } from '../components/charts';
import { BOT_LEVELS } from '../engine/Engine';
import { requestAnalysis, useGameRecord } from './analyze';

export const CLASSES = [
  { cls: 'best', label: 'Best', sym: '★' },
  { cls: 'excellent', label: 'Excellent', sym: '!' },
  { cls: 'good', label: 'Good', sym: '✓' },
  { cls: 'inaccuracy', label: 'Inaccuracy', sym: '?!' },
  { cls: 'mistake', label: 'Mistake', sym: '?' },
  { cls: 'blunder', label: 'Blunder', sym: '??' },
];
const VERDICT = { best: 'the best move', excellent: 'an excellent move', good: 'a good move', inaccuracy: 'an inaccuracy', mistake: 'a mistake', blunder: 'a blunder' };
const SYM = Object.fromEntries(CLASSES.map((c) => [c.cls, c.sym]));
const ARROW = { best: 'rgba(40,180,90,.9)' };

export function eloBand(elo) {
  if (!elo) return '';
  if (elo < 800) return 'Beginner';
  if (elo < 1200) return 'Improving beginner';
  if (elo < 1500) return 'Casual club player';
  if (elo < 1800) return 'Club player';
  if (elo < 2100) return 'Strong club player';
  if (elo < 2400) return 'Expert';
  return 'Master level';
}

export function ResultBadge({ outcome }) {
  return <span className={`result-badge ${outcome}`}>{outcome === 'win' ? 'Win' : outcome === 'loss' ? 'Loss' : 'Draw'}</span>;
}

/** Compact stats shown in the Play tab right after a game. */
export function ReviewSummary({ record, progress, onOpen }) {
  if (!record) return null;
  const me = record.analysis?.[record.playerColor];
  return (
    <div className="card review-summary">
      <div className="card-head">
        <h3>📊 Game review</h3>
        <ResultBadge outcome={record.outcome} />
      </div>
      {!record.analysis ? (
        <>
          <div className="muted small">Stockfish is checking every move…</div>
          <div className="progress"><div style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} /></div>
        </>
      ) : (
        <>
          <div className="review-tiles">
            <div><b>{me.accuracy ?? '—'}{me.accuracy != null && '%'}</b><span>Accuracy</span></div>
            <div><b>{me.estElo ? `~${me.estElo}` : '—'}</b><span>Est. Elo this game</span></div>
            <div className="bad"><b>{me.counts.mistake + me.counts.blunder}</b><span>Mistakes + blunders</span></div>
          </div>
          {!me.estElo && <div className="muted small">Game too short for an Elo estimate (needs 8+ of your moves).</div>}
        </>
      )}
      <button className="btn primary full" onClick={onOpen}>See full review</button>
    </div>
  );
}

export default function GameReview({ profileId, gameId, onClose, onExplore }) {
  const { record, progress } = useGameRecord(profileId, gameId);
  const [ply, setPly] = useState(null);
  const a = record?.analysis;

  useEffect(() => {
    if (record && !record.analysis) requestAnalysis(record);
  }, [record]);

  // Open on the final position.
  useEffect(() => {
    if (a && ply == null) setPly(record.sans.length);
  }, [a, ply, record]);

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (!record) return;
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, (p ?? record.sans.length) - 1));
      if (e.key === 'ArrowRight') setPly((p) => Math.min(record.sans.length, (p ?? record.sans.length) + 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, record]);

  const cur = ply ?? record?.sans.length ?? 0;
  const pos = useMemo(() => (record ? replay(record.sans.slice(0, cur)) : null), [record, cur]);
  if (!record) return null;

  const level = BOT_LEVELS.find((l) => l.id === record.levelId);
  const me = a?.[record.playerColor];
  const bot = a?.[record.playerColor === 'w' ? 'b' : 'w'];
  const move = a && cur > 0 ? a.moves[cur - 1] : null;
  const annotations = a ? Object.fromEntries(a.moves.filter((m) => m.color === record.playerColor || ['mistake', 'blunder'].includes(m.cls)).map((m) => [m.ply, { cls: m.cls, sym: SYM[m.cls] }])) : {};
  const keyMoments = a ? a.moves.filter((m) => m.color === record.playerColor && ['blunder', 'mistake', 'inaccuracy'].includes(m.cls)).sort((x, y) => y.loss - x.loss).slice(0, 6).sort((x, y) => x.ply - y.ply) : [];

  // Show what was played (colored by grade) and what the engine preferred.
  const arrows = [];
  if (move) {
    const prev = replay(record.sans.slice(0, cur - 1));
    const m = prev.move(move.san);
    if (move.best) {
      arrows.push({ startSquare: m.from, endSquare: m.to, color: 'rgba(229,83,75,.75)' });
      arrows.push({ startSquare: move.best.slice(0, 2), endSquare: move.best.slice(2, 4), color: ARROW.best });
    }
  }
  const last = pos.history({ verbose: true }).at(-1);
  const moveNo = (m) => `${Math.floor(m.ply / 2) + 1}${m.color === 'w' ? '.' : '…'} ${m.san}`;
  const date = new Date(record.date);

  return createPortal(
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal review" role="dialog" aria-label="Game review">
        <div className="review-head">
          <div>
            <h2>
              <ResultBadge outcome={record.outcome} /> vs {level?.name ?? 'Bot'} <span className="muted">(Level {record.levelId}, {level?.approx})</span>
            </h2>
            <div className="muted small">
              {record.reason} · {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · You played {record.playerColor === 'w' ? 'White' : 'Black'} · {record.tc === 'none' ? 'Untimed' : record.tc} · {Math.ceil(record.sans.length / 2)} moves
              {record.opening && ` · ${record.opening}`}
            </div>
          </div>
          <button className="btn" onClick={onClose}>✕ Close</button>
        </div>

        {!a ? (
          <div className="review-loading">
            <div className="spinner" />
            <div>Stockfish is analyzing all {record.sans.length} moves…</div>
            <div className="progress wide"><div style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} /></div>
          </div>
        ) : (
          <div className="review-body">
            <div className="review-board">
              <Board fen={pos.fen()} orientation={record.playerColor === 'w' ? 'white' : 'black'} movableColor={null} arrows={arrows} lastMove={last ? { from: last.from, to: last.to } : null} />
              <div className="btn-row center">
                <button className="btn" onClick={() => setPly(0)}>⏮</button>
                <button className="btn" onClick={() => setPly(Math.max(0, cur - 1))}>◀</button>
                <button className="btn" onClick={() => setPly(Math.min(record.sans.length, cur + 1))}>▶</button>
                <button className="btn" onClick={() => setPly(record.sans.length)}>⏭</button>
                <button className="btn" onClick={() => onExplore(record.sans.slice(0, cur), record.playerColor)}>🧠 Explore in Coach</button>
              </div>
              <div className={`move-verdict ${move?.cls ?? ''}`}>
                {!move ? (
                  <span className="muted">Starting position. Use ◀ ▶ or click the graph.</span>
                ) : (
                  <>
                    <span className={`tag big ${move.cls}`}>{SYM[move.cls]}</span>
                    <b>{moveNo(move)}</b> — {move.color === record.playerColor ? 'your move' : `${level?.name}'s move`} was{' '}
<b>{VERDICT[move.cls]}</b>
                    {move.bestSan && (
                      <>
                        . Best was <b className="good-text">{move.bestSan}</b> (green arrow)
                        {move.loss >= 50 && <span className="muted"> — cost about {(move.loss / 100).toFixed(1)} pawns</span>}
                      </>
                    )}
                    .
                  </>
                )}
              </div>
            </div>

            <div className="review-side">
              <div className="card">
                <div className="vs-head">
                  <span>You</span>
                  <span />
                  <span>{level?.name}</span>
                </div>
                <div className="vs-row big">
                  <b>{me.accuracy ?? '—'}%</b>
                  <span>Accuracy</span>
                  <b>{bot.accuracy ?? '—'}%</b>
                </div>
                <div className="vs-row big">
                  <b className="elo">{me.estElo ? `~${me.estElo}` : '—'}</b>
                  <span>Est. Elo</span>
                  <b>{bot.estElo ? `~${bot.estElo}` : '—'}</b>
                </div>
                {CLASSES.map((c) => (
                  <div className="vs-row" key={c.cls}>
                    <b>{me.counts[c.cls]}</b>
                    <span><span className={`tag ${c.cls}`}>{c.sym}</span> {c.label}</span>
                    <b>{bot.counts[c.cls]}</b>
                  </div>
                ))}
                {me.estElo && (
                  <div className="muted small elo-note">
                    You played like a <b>{eloBand(me.estElo)}</b> this game (~{me.estElo}). One game is a rough guess — your Progress page averages your recent games for a steadier number.
                  </div>
                )}
              </div>

              <div className="card">
                <h3>Accuracy by phase</h3>
                <div className="phase-row">
                  {['opening', 'middlegame', 'endgame'].map((ph) => (
                    <div key={ph} className="phase">
                      <b>{me.phases[ph] ? `${me.phases[ph].accuracy}%` : '—'}</b>
                      <span>{ph[0].toUpperCase() + ph.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>Evaluation</h3>
                <EvalGraph evals={a.evals} moves={a.moves} current={cur} onPick={setPly} />
              </div>

              <div className="card">
                <h3>Key moments for you</h3>
                {keyMoments.length === 0 ? (
                  <div className="muted small">No inaccuracies, mistakes or blunders — great game! 🎉</div>
                ) : (
                  <div className="moments">
                    {keyMoments.map((m) => (
                      <button key={m.ply} className={`moment ${cur === m.ply + 1 ? 'on' : ''}`} onClick={() => setPly(m.ply + 1)}>
                        <span className={`tag ${m.cls}`}>{SYM[m.cls]}</span>
                        <b>{moveNo(m)}</b>
                        <span className="muted">best was {m.bestSan}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3>Moves</h3>
                <MoveList sans={record.sans} current={cur} onJump={setPly} annotations={annotations} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
