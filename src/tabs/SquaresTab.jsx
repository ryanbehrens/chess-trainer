import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemedBoard } from '../theme/ThemeContext';

const FILES = 'abcdefgh';
const ALL_SQUARES = [...FILES].flatMap((f) => [1, 2, 3, 4, 5, 6, 7, 8].map((r) => f + r));
const STORE_KEY = 'chess-trainer-squares-v1';
const LENGTHS = [10, 20, 30, 0]; // 0 = endless practice

function loadStats() {
  try {
    return { best: {}, history: [], squares: {}, ...JSON.parse(localStorage.getItem(STORE_KEY)) };
  } catch {
    return { best: {}, history: [], squares: {} };
  }
}
function saveStats(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}
const fmt = (ms) => (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + 's';

export default function SquaresTab({ active }) {
  const [mode, setMode] = useState('find'); // 'find' = click the named square, 'name' = type the highlighted square
  const [length, setLength] = useState(20);
  const [side, setSide] = useState('w'); // 'w' | 'b' | 'mix'
  const [showCoords, setShowCoords] = useState(false);
  const [focusWeak, setFocusWeak] = useState(false);

  const [status, setStatus] = useState('idle'); // idle | running | done
  const [target, setTarget] = useState(null);
  const [orientation, setOrientation] = useState('white');
  const [results, setResults] = useState([]); // {sq, ms, ok}
  const [startAt, setStartAt] = useState(0);
  const [squareAt, setSquareAt] = useState(0);
  const [now, setNow] = useState(0);
  const [flash, setFlash] = useState(null); // {wrong, right} while feedback is showing
  const [effects, setEffects] = useState([]); // board animations: {id, type, sq}
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [shake, setShake] = useState(false);
  const fxId = useRef(0);
  const [typed, setTyped] = useState('');
  const [stats, setStats] = useState(loadStats);
  const [lastRun, setLastRun] = useState(null);
  const locked = useRef(false);
  const answerRef = useRef(null);

  const configKey = `${mode}-${length}-${side}`;
  const misses = results.filter((r) => !r.ok).length;

  // live timer
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(performance.now()), 50);
    return () => clearInterval(id);
  }, [status]);

  const pickSquare = useCallback(
    (prev) => {
      const pool = ALL_SQUARES.filter((s) => s !== prev);
      if (!focusWeak) return pool[Math.floor(Math.random() * pool.length)];
      const w = pool.map((s) => {
        const st = stats.squares[s];
        if (!st) return 3; // never practiced: treat as weak
        const avg = st.totalMs / Math.max(1, st.seen);
        return 1 + (st.miss / st.seen) * 8 + Math.min(4, avg / 800);
      });
      let r = Math.random() * w.reduce((a, b) => a + b, 0);
      return pool.find((_, i) => (r -= w[i]) < 0) ?? pool[0];
    },
    [focusWeak, stats.squares],
  );

  function addFx(type, sq, ms, variant) {
    const id = ++fxId.current;
    // only one anchor label at a time
    setEffects((fx) => [...(type === 'label' ? fx.filter((e) => e.type !== 'label') : fx), { id, type, sq, variant }]);
    setTimeout(() => setEffects((fx) => fx.filter((e) => e.id !== id)), ms);
  }

  function nextOrientation() {
    if (side === 'w') return 'white';
    if (side === 'b') return 'black';
    return Math.random() < 0.5 ? 'white' : 'black';
  }

  function start() {
    const t = performance.now();
    setResults([]);
    setStatus('running');
    setStartAt(t);
    setSquareAt(t);
    setNow(t);
    setTyped('');
    setFlash(null);
    setEffects([]);
    setStreak(0);
    setBestStreak(0);
    setLastRun(null);
    setOrientation(nextOrientation());
    setTarget(pickSquare(null));
    locked.current = false;
  }

  function finish(all) {
    const totalMs = all.reduce((a, r) => a + r.ms, 0);
    const missCount = all.filter((r) => !r.ok).length;
    setStatus('done');
    setTarget(null);
    setStats((s) => {
      const squares = { ...s.squares };
      for (const r of all) {
        const cur = squares[r.sq] || { seen: 0, miss: 0, totalMs: 0 };
        squares[r.sq] = { seen: cur.seen + 1, miss: cur.miss + (r.ok ? 0 : 1), totalMs: cur.totalMs + r.ms };
      }
      const next = { ...s, squares };
      if (length > 0) {
        // Score = total time + 2s penalty per miss (lower is better)
        const score = totalMs + missCount * 2000;
        const prevBest = s.best[configKey];
        const isBest = !prevBest || score < prevBest;
        if (isBest) next.best = { ...s.best, [configKey]: score };
        next.history = [...s.history, { key: configKey, at: Date.now(), score, avgMs: totalMs / all.length, misses: missCount }].slice(-200);
        setLastRun({ score, totalMs, missCount, isBest, prevBest });
      }
      saveStats(next);
      return next;
    });
  }

  function answer(sq) {
    if (status !== 'running' || locked.current || !target) return;
    const t = performance.now();
    const ok = sq === target;
    const entry = { sq: target, ms: t - squareAt, ok };
    const all = [...results, entry];
    setResults(all);
    locked.current = true;
    setFlash(ok ? { right: target } : { wrong: sq, right: target });
    if (ok) {
      addFx('correct', target, 900);
      addFx('label', target, 3800, 'right'); // appears after the pop, stays ~3s
      setStreak((n) => {
        setBestStreak((b) => Math.max(b, n + 1));
        return n + 1;
      });
    } else {
      if (ALL_SQUARES.includes(sq)) addFx('wrong', sq, 1100);
      addFx('reveal', target, 1200);
      addFx('label', target, 4200, 'missed');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    // short pause on a hit so the pop is visible; longer on a miss so you can see where it really was.
    // (Neither pause counts toward your time — the clock for the next square starts after it.)
    const delay = ok ? 320 : 1100;
    setTimeout(() => {
      setFlash(null);
      setTyped('');
      locked.current = false;
      if (length > 0 && all.length >= length) {
        finish(all);
        return;
      }
      setOrientation(nextOrientation());
      setTarget((prev) => pickSquare(prev));
      setSquareAt(performance.now());
    }, delay);
  }

  answerRef.current = answer;

  function stop() {
    if (length === 0 && results.length) finish(results);
    else {
      setStatus('idle');
      setTarget(null);
    }
  }

  // Keyboard: Enter/Space to start; in "name" mode type the square (e.g. "e" then "4")
  useEffect(() => {
    const h = (e) => {
      if (!active || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (status !== 'running' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        start();
        return;
      }
      if (status === 'running' && e.key === 'Escape') stop();
      if (status !== 'running' || mode !== 'name') return;
      const k = e.key.toLowerCase();
      if (k === 'backspace') setTyped('');
      else if (typed.length === 0 && FILES.includes(k)) setTyped(k);
      else if (typed.length === 1 && /[1-8]/.test(k)) answer(typed + k);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  function tapKey(k) {
    if (status !== 'running') return;
    if (FILES.includes(k)) setTyped(k);
    else if (typed) answer(typed + k);
  }

  // Board highlights
  const squareStyles = {};
  if (mode === 'name' && target && !flash) squareStyles[target] = { background: 'radial-gradient(circle, #3b82f6 0 45%, rgba(59,130,246,.35) 60%)', boxShadow: 'inset 0 0 0 4px #60a5fa' };

  const elapsed = status === 'running' ? now - startAt : 0;
  const done = results.length;
  const avg = done ? results.reduce((a, r) => a + r.ms, 0) / done : 0;
  const history = stats.history.filter((h) => h.key === configKey).slice(-12);
  const maxScore = Math.max(1, ...history.map((h) => h.score));
  const best = stats.best[configKey];

  const boardOptions = useMemo(
    () => ({
      id: 'squaretrainer',
      position: '8/8/8/8/8/8/8/8 w - - 0 1',
      boardOrientation: orientation,
      allowDragging: false,
      allowDrawingArrows: false,
      squareStyles,
      onSquareClick: ({ square }) => mode === 'find' && answerRef.current(square),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orientation, JSON.stringify(squareStyles), mode],
  );

  return (
    <div className="layout">
      <div className="board-col">
        <div className={`prompt ${status}`}>
          {status === 'running' ? (
            mode === 'find' ? (
              <>
                Click <b className="prompt-sq">{target}</b>
              </>
            ) : (
              <>
                Name the <span className="prompt-blue">blue</span> square: <b className="prompt-sq">{(typed || '_') + '_'}</b>
              </>
            )
          ) : status === 'done' ? (
            <>Done! Press <kbd>Enter</kbd> to go again</>
          ) : (
            <>Press <kbd>Enter</kbd> or Start</>
          )}
          {status === 'running' && streak >= 2 && (
            <span key={streak} className="streak">🔥 {streak} in a row</span>
          )}
          {status === 'running' && <span className="side-note">{orientation === 'white' ? 'White' : 'Black'} at the bottom</span>}
        </div>
        <ThemedBoard
          options={boardOptions}
          themeOverrides={{ coords: showCoords }}
          className={shake ? 'shake' : ''}
          overlay={<FxOverlay effects={effects} orientation={orientation} />}
        />
        {mode === 'name' && status === 'running' && (
          <div className="keypad">
            {[...FILES].map((f) => (
              <button key={f} className={`btn small ${typed === f ? 'primary' : ''}`} onClick={() => tapKey(f)}>
                {f}
              </button>
            ))}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
              <button key={r} className="btn small" disabled={!typed} onClick={() => tapKey(String(r))}>
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="panel">
        <div className="card">
          <h3>🎯 Square trainer</h3>
          <div className="seg">
            <button className={mode === 'find' ? 'on' : ''} disabled={status === 'running'} onClick={() => setMode('find')}>Find the square</button>
            <button className={mode === 'name' ? 'on' : ''} disabled={status === 'running'} onClick={() => setMode('name')}>Name the square</button>
          </div>
          <label className="field">
            Squares per run
            <select value={length} disabled={status === 'running'} onChange={(e) => setLength(+e.target.value)}>
              {LENGTHS.map((l) => (
                <option key={l} value={l}>{l ? `${l} squares (timed)` : 'Endless practice'}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Board view
            <select value={side} disabled={status === 'running'} onChange={(e) => setSide(e.target.value)}>
              <option value="w">From White's side</option>
              <option value="b">From Black's side</option>
              <option value="mix">Random flips (hardest)</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={showCoords} onChange={(e) => setShowCoords(e.target.checked)} />
            Show coordinates (easier)
          </label>
          <label className="check">
            <input type="checkbox" checked={focusWeak} onChange={(e) => setFocusWeak(e.target.checked)} />
            Focus on my weak squares
          </label>
          <div className="btn-row">
            {status === 'running' ? (
              <button className="btn" onClick={stop}>■ Stop (Esc)</button>
            ) : (
              <button className="btn primary" onClick={start}>▶ Start (Enter)</button>
            )}
          </div>
        </div>

        <div className="card stats">
          <div className="stat">
            <span className="muted small">Time</span>
            <b className="big-num">{fmt(status === 'running' ? elapsed : lastRun?.totalMs ?? 0)}</b>
          </div>
          <div className="stat">
            <span className="muted small">Squares</span>
            <b className="big-num">{done}{length ? `/${length}` : ''}</b>
          </div>
          <div className="stat">
            <span className="muted small">Avg / square</span>
            <b className="big-num">{done ? fmt(avg) : '–'}</b>
          </div>
          <div className="stat">
            <span className="muted small">Misses</span>
            <b className={`big-num ${misses ? 'bad' : ''}`}>{misses}</b>
          </div>
        </div>

        {lastRun && (
          <div className={`card status over`}>
            {lastRun.isBest ? <strong>🏆 New personal best: {fmt(lastRun.score)}</strong> : <strong>Score: {fmt(lastRun.score)}</strong>}
            <div className="small muted">
              Best streak: {bestStreak} 🔥 · Score = time + 2s per miss.{' '}
              {!lastRun.isBest && lastRun.prevBest && <>Best is {fmt(lastRun.prevBest)}.</>}
            </div>
          </div>
        )}

        {length > 0 && (
          <div className="card">
            <div className="card-head">
              <h3>Progress</h3>
              <span className="muted small">{best ? `Best ${fmt(best)}` : 'No runs yet'}</span>
            </div>
            {history.length ? (
              <div className="bars" title="Your recent scores for this setup (lower is better)">
                {history.map((h, i) => (
                  <div key={i} className="bar-col">
                    <div className={`bar ${h.score === best ? 'best' : ''}`} style={{ height: `${(h.score / maxScore) * 100}%` }} />
                    <span>{(h.score / 1000).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted small">Finish a run to start tracking your times.</div>
            )}
          </div>
        )}

        <div className="card">
          <h3>Your squares</h3>
          <Heatmap squares={stats.squares} />
          <div className="muted small">Green = fast, red = slow or often missed. Grey = not practiced yet.</div>
        </div>
      </aside>
    </div>
  );
}

function FxOverlay({ effects, orientation }) {
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'white' ? [...FILES] : [...FILES].reverse();
  return (
    <div className="fx-grid">
      {ranks.flatMap((r) =>
        files.map((f) => {
          const sq = f + r;
          return (
            <div key={sq} className="fx-cell">
              {effects
                .filter((e) => e.sq === sq)
                .map((e) => (
                  <Effect key={e.id} e={e} />
                ))}
            </div>
          );
        }),
      )}
    </div>
  );
}

function Effect({ e }) {
  if (e.type === 'correct')
    return (
      <div className="fx-correct">
        <span className="ring" />
        <span className="ring r2" />
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} style={{ '--a': `${i * 36}deg`, '--d': `${i % 2 ? 62 : 80}cqw` }} />
        ))}
        <span className="mark">✓</span>
      </div>
    );
  if (e.type === 'wrong')
    return (
      <div className="fx-wrong">
        <span className="mark">✕</span>
      </div>
    );
  if (e.type === 'reveal') return <div className="fx-reveal" />;
  if (e.type === 'label') return <div className={`fx-label ${e.variant}`}>{e.sq}</div>;
  return null;
}

function Heatmap({ squares }) {
  const cells = [];
  for (let r = 8; r >= 1; r--)
    for (const f of FILES) {
      const sq = f + r;
      const st = squares[sq];
      let bg = '#3a3f4b';
      let title = `${sq}: not practiced`;
      if (st) {
        const avg = st.totalMs / st.seen;
        const missRate = st.miss / st.seen;
        // 0 (good) .. 1 (bad)
        const bad = Math.min(1, Math.max(0, (avg - 700) / 2300) * 0.6 + missRate * 1.4);
        const hue = 130 - bad * 130;
        bg = `hsl(${hue} 60% 42%)`;
        title = `${sq}: avg ${fmt(avg)}, missed ${st.miss}/${st.seen}`;
      }
      cells.push(
        <div key={sq} className="heat" style={{ background: bg }} title={title}>
          {sq}
        </div>,
      );
    }
  return <div className="heatmap">{cells}</div>;
}
