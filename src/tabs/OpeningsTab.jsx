import { pkey } from '../profile/store';
import { useEffect, useMemo, useRef, useState } from 'react';
import Board from '../components/Board';
import { lastMoveOf, numbered, replay } from '../components/common';
import { ALL_LINES, OPENINGS } from '../data/openings';

const STORE_KEY = 'chess-trainer-progress-v1';
const MASTERED = 3; // perfect runs needed to mark a line mastered

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(pkey(STORE_KEY))) || {};
  } catch {
    return {};
  }
}
function saveProgress(p) {
  try {
    localStorage.setItem(pkey(STORE_KEY), JSON.stringify(p));
  } catch {
    /* storage unavailable — progress just won't persist */
  }
}

export default function OpeningsTab({ onContinueInCoach, active }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState(OPENINGS[0].id);
  const [lineId, setLineId] = useState(`${OPENINGS[0].id}-0`);
  const [mode, setMode] = useState('study'); // 'study' | 'drill'
  const [side, setSide] = useState(OPENINGS[0].side === 'white' ? 'w' : 'b');
  const [ply, setPly] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongHere, setWrongHere] = useState(0);
  const [flash, setFlash] = useState(null);
  const [progress, setProgress] = useState(loadProgress);
  const timer = useRef(null);

  const opening = OPENINGS.find((o) => o.id === openingId);
  const line = ALL_LINES.find((l) => l.id === lineId);
  const game = useMemo(() => replay(line.sans.slice(0, ply)), [line, ply]);
  const done = ply >= line.sans.length;
  const turn = game.turn();
  const expected = line.sans[ply];
  const expectedMove = useMemo(() => {
    if (!expected) return null;
    const m = replay(line.sans.slice(0, ply)).move(expected);
    return { from: m.from, to: m.to };
  }, [line, ply, expected]);

  const visible = OPENINGS.filter(
    (o) =>
      (filter === 'all' || o.side === filter) &&
      (!query || (o.name + o.lines.map((l) => l.name).join(' ')).toLowerCase().includes(query.toLowerCase())),
  );

  function selectLine(id, newMode = mode) {
    const l = ALL_LINES.find((x) => x.id === id);
    clearTimeout(timer.current);
    setOpeningId(l.openingId);
    setLineId(id);
    setSide(l.side === 'white' ? 'w' : 'b');
    setMode(newMode);
    setPly(0);
    setMistakes(0);
    setWrongHere(0);
    setFlash(null);
  }

  function selectOpening(o) {
    selectLine(`${o.id}-0`);
  }

  function restart(newMode = mode, newSide = side) {
    clearTimeout(timer.current);
    setMode(newMode);
    setSide(newSide);
    setPly(0);
    setMistakes(0);
    setWrongHere(0);
    setFlash(null);
  }

  function randomLine(pool) {
    // favor lines you haven't mastered yet
    const weights = pool.map((l) => Math.max(1, MASTERED + 1 - (progress[l.id]?.perfect ?? 0)) ** 2);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    const pick = pool.find((_, i) => (r -= weights[i]) < 0) ?? pool[0];
    selectLine(pick.id, 'drill');
  }

  // Drill: auto-play the opponent's book moves
  useEffect(() => {
    if (mode !== 'drill' || done || turn === side) return;
    timer.current = setTimeout(() => setPly((p) => p + 1), 550);
    return () => clearTimeout(timer.current);
  }, [mode, done, turn, side, ply]);

  // Drill: record result when finished
  const recorded = useRef(null);
  useEffect(() => {
    if (mode !== 'drill' || !done || recorded.current === lineId) return;
    recorded.current = lineId;
    setProgress((p) => {
      const cur = p[lineId] || { runs: 0, perfect: 0 };
      const next = { ...p, [lineId]: { runs: cur.runs + 1, perfect: cur.perfect + (mistakes === 0 ? 1 : 0), last: mistakes } };
      saveProgress(next);
      return next;
    });
  }, [mode, done, lineId, mistakes]);
  useEffect(() => {
    if (ply === 0) recorded.current = null;
  }, [ply]);

  function onMove({ from, to, promotion }) {
    if (done) return false;
    if (mode === 'study') {
      // In study mode you can play the next book move on the board too
      if (expectedMove && from === expectedMove.from && to === expectedMove.to) {
        setPly(ply + 1);
        return true;
      }
      setFlash({ square: to, color: 'rgba(220,50,50,.55)' });
      setTimeout(() => setFlash(null), 500);
      return false;
    }
    // drill
    let san;
    try {
      san = replay(line.sans.slice(0, ply)).move({ from, to, promotion }).san;
    } catch {
      return false;
    }
    if (san === expected) {
      setPly(ply + 1);
      setWrongHere(0);
      setFlash({ square: to, color: 'rgba(40,190,90,.55)' });
      setTimeout(() => setFlash(null), 400);
      return true;
    }
    setMistakes((m) => m + 1);
    setWrongHere((w) => w + 1);
    setFlash({ square: to, color: 'rgba(220,50,50,.6)' });
    setTimeout(() => setFlash(null), 600);
    return false;
  }

  // keyboard navigation in study mode
  useEffect(() => {
    const h = (e) => {
      if (!active || mode !== 'study' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') setPly((p) => Math.min(line.sans.length, p + 1));
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mode, line, active]);

  const arrows = [];
  if (expectedMove && (mode === 'study' || (mode === 'drill' && wrongHere > 0 && turn === side))) {
    arrows.push({ startSquare: expectedMove.from, endSquare: expectedMove.to, color: mode === 'study' ? 'rgba(40,120,230,.8)' : 'rgba(30,170,80,.9)' });
  }

  const sideLines = (s) => ALL_LINES.filter((l) => l.side === s);
  const masteredCount = (pool) => pool.filter((l) => (progress[l.id]?.perfect ?? 0) >= MASTERED).length;

  return (
    <div className="layout openings">
      <aside className="panel left">
        <div className="card">
          <input className="search" placeholder="Search openings…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="seg">
            {['all', 'white', 'black'].map((f) => (
              <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : `As ${f[0].toUpperCase() + f.slice(1)}`}
              </button>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn small" onClick={() => randomLine(sideLines('white'))}>🎲 Drill random White line</button>
            <button className="btn small" onClick={() => randomLine(sideLines('black'))}>🎲 Drill random Black line</button>
          </div>
          <div className="muted small">
            Mastered: {masteredCount(ALL_LINES)} / {ALL_LINES.length} lines (a line is mastered after {MASTERED} perfect drills)
          </div>
        </div>
        <div className="card grow scroll">
          {visible.map((o) => {
            const pool = ALL_LINES.filter((l) => l.openingId === o.id);
            return (
              <div key={o.id} className={`opening ${o.id === openingId ? 'active' : ''}`}>
                <button className="opening-head" onClick={() => selectOpening(o)}>
                  <span className={`side-dot ${o.side}`} />
                  <span className="grow">{o.name}</span>
                  <span className="muted small">{masteredCount(pool)}/{pool.length}</span>
                </button>
                {o.id === openingId && (
                  <div className="line-list">
                    {pool.map((l) => {
                      const pr = progress[l.id];
                      return (
                        <button key={l.id} className={`line-item ${l.id === lineId ? 'active' : ''}`} onClick={() => selectLine(l.id)}>
                          <span className="grow">{l.name}</span>
                          <span className="muted small">{l.sans.length / 2 | 0}+ mv</span>
                          {pr && <span className={`badge ${pr.perfect >= MASTERED ? 'gold' : ''}`}>{pr.perfect >= MASTERED ? '✓' : `${pr.perfect}/${MASTERED}`}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="board-col">
        <Board
          fen={game.fen()}
          orientation={side === 'w' ? 'white' : 'black'}
          movableColor={done ? null : mode === 'study' ? turn : turn === side ? side : null}
          onMove={onMove}
          arrows={arrows}
          lastMove={lastMoveOf(game)}
          flash={flash}
        />
        {mode === 'study' && (
          <div className="btn-row center">
            <button className="btn" onClick={() => setPly(0)}>⏮</button>
            <button className="btn" onClick={() => setPly(Math.max(0, ply - 1))}>◀</button>
            <button className="btn primary" onClick={() => setPly(Math.min(line.sans.length, ply + 1))}>Next ▶</button>
            <button className="btn" onClick={() => setPly(line.sans.length)}>⏭</button>
          </div>
        )}
      </div>

      <aside className="panel">
        <div className="card">
          <h3>{opening.name} <span className="muted small">{opening.eco}</span></h3>
          <p className="small">{opening.summary}</p>
        </div>
        <div className="card">
          <h4>{line.name}</h4>
          <p className="small">{line.idea}</p>
          <div className="seg">
            <button className={mode === 'study' ? 'on' : ''} onClick={() => restart('study')}>📘 Study</button>
            <button className={mode === 'drill' ? 'on' : ''} onClick={() => restart('drill')}>🎯 Drill</button>
          </div>
          <div className="seg">
            <button className={side === 'w' ? 'on' : ''} onClick={() => restart(mode, 'w')}>Play White</button>
            <button className={side === 'b' ? 'on' : ''} onClick={() => restart(mode, 'b')}>Play Black</button>
          </div>
        </div>

        <div className={`card status ${done ? 'over' : ''}`}>
          {mode === 'study' ? (
            done ? (
              <strong>End of line. Try the 🎯 Drill to test yourself.</strong>
            ) : (
              <span>
                Next: <b>{numbered([expected], ply)}</b> — press Next, use →, or play it on the board.
              </span>
            )
          ) : done ? (
            <div>
              <strong>{mistakes === 0 ? '🏆 Perfect! Line complete.' : `Line complete with ${mistakes} mistake${mistakes > 1 ? 's' : ''}.`}</strong>
              <div className="btn-row">
                <button className="btn primary" onClick={() => restart('drill')}>Again</button>
                <button className="btn" onClick={() => randomLine(ALL_LINES.filter((l) => l.openingId === openingId))}>Random line</button>
              </div>
            </div>
          ) : turn === side ? (
            <span>
              Your move. {wrongHere > 0 ? <>Not quite — the book move is <b>{expected}</b> (green arrow).</> : 'What does theory play here?'}
              <span className="muted small"> Mistakes: {mistakes}</span>
            </span>
          ) : (
            <span className="muted">Opponent is playing…</span>
          )}
          {done && (
            <button className="btn" onClick={() => onContinueInCoach(line.sans, side)}>
              🔍 Keep playing from here with the Coach
            </button>
          )}
        </div>

        <div className="card grow">
          <h3>Line</h3>
          <div className="line-moves">
            {line.sans.map((s, i) => {
              const hidden = mode === 'drill' && i >= ply;
              return (
                <span key={i} className={`lm ${i === ply - 1 ? 'active' : ''} ${hidden ? 'hidden' : ''}`} onClick={() => mode === 'study' && setPly(i + 1)}>
                  {i % 2 === 0 && <span className="move-no">{i / 2 + 1}.</span>}
                  {hidden ? '···' : s}
                </span>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
