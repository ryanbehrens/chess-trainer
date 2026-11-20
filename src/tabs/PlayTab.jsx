import { useEffect, useMemo, useRef, useState } from 'react';
import Board from '../components/Board';
import { CapturedRow, MoveList, materialOf, materialSummary, replay, gameResult, lastMoveOf, uciToSan } from '../components/common';
import { getEngine } from '../engine/engines';
import { BOT_LEVELS } from '../engine/Engine';
import { lookupBook } from '../data/openings';

const LEVEL_KEY = 'chess-trainer-bot-level';
const TC_KEY = 'chess-trainer-time-control';

// [id, label, minutes, increment seconds]
const TIME_CONTROLS = [
  { id: 'none', group: 'Untimed', label: 'No clock' },
  { id: '1+0', group: 'Bullet', min: 1, inc: 0 },
  { id: '2+1', group: 'Bullet', min: 2, inc: 1 },
  { id: '3+0', group: 'Blitz', min: 3, inc: 0 },
  { id: '3+2', group: 'Blitz', min: 3, inc: 2 },
  { id: '5+0', group: 'Blitz', min: 5, inc: 0 },
  { id: '5+3', group: 'Blitz', min: 5, inc: 3 },
  { id: '10+0', group: 'Rapid', min: 10, inc: 0 },
  { id: '10+5', group: 'Rapid', min: 10, inc: 5 },
  { id: '15+10', group: 'Rapid', min: 15, inc: 10 },
  { id: '30+0', group: 'Classical', min: 30, inc: 0 },
  { id: '30+20', group: 'Classical', min: 30, inc: 20 },
];
const tcById = (id) => TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[0];
const freshClock = (tc) => ({ w: (tc.min ?? 0) * 60000, b: (tc.min ?? 0) * 60000, since: null });

function fmtClock(ms) {
  ms = Math.max(0, ms);
  if (ms < 10000) return (ms / 1000).toFixed(1);
  const t = Math.ceil(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(sec).padStart(2, '0')}`;
}

// Level graphics: pieces climb in rank as the bot gets stronger.
const LEVEL_ICON = ['♟', '♞', '♝', '♜', '♛', '♚', '🏆', '🤖'];
const LEVEL_SHORT = ['Beginner', 'Novice', 'Casual', 'Club', 'Strong', 'Expert', 'Master', 'Max'];
const LEVEL_HUE = [140, 115, 90, 65, 40, 20, 0, 280];

/** A little clock face: the colored wedge is the starting time (out of an hour), the badge is the increment. */
function ClockIcon({ tc }) {
  if (!tc.min) {
    return (
      <svg className="tc-icon" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="17" className="face" />
        <path d="M11 20c0-4 5-4 9 0s9 4 9 0-5-4-9 0-9 4-9 0z" className="inf" />
      </svg>
    );
  }
  const frac = Math.min(tc.min / 60, 0.999);
  const ang = frac * 2 * Math.PI;
  const x = 20 + 15 * Math.sin(ang), y = 20 - 15 * Math.cos(ang);
  const wedge = `M20 20 L20 5 A15 15 0 ${frac > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
  return (
    <svg className="tc-icon" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="17" className="face" />
      <path d={wedge} className="wedge" />
      {[0, 90, 180, 270].map((d) => (
        <line key={d} x1="20" y1="4.5" x2="20" y2="7" className="mark" transform={`rotate(${d} 20 20)`} />
      ))}
      <line x1="20" y1="20" x2={x.toFixed(2)} y2={y.toFixed(2)} className="hand" />
      <circle cx="20" cy="20" r="1.8" className="hub" />
      {tc.inc > 0 && (
        <g className="inc">
          <circle cx="32" cy="8" r="7.5" />
          <text x="32" y="10.8" textAnchor="middle">+{tc.inc}</text>
        </g>
      )}
    </svg>
  );
}

function Clock({ ms, running, flagged }) {
  return (
    <span className={`clock ${running ? 'running' : ''} ${ms < 20000 ? 'low' : ''} ${flagged ? 'flagged' : ''}`}>
      {running && <span className="tick" />}
      {fmtClock(ms)}
    </span>
  );
}

export default function PlayTab({ onAnalyze }) {
  const [sans, setSans] = useState([]);
  const [playerColor, setPlayerColor] = useState('w');
  const [levelId, setLevelIdState] = useState(() => {
    try {
      const saved = +localStorage.getItem(LEVEL_KEY);
      return BOT_LEVELS.some((l) => l.id === saved) ? saved : 4;
    } catch {
      return 4;
    }
  });
  const setLevelId = (id) => {
    setLevelIdState(id);
    try {
      localStorage.setItem(LEVEL_KEY, String(id));
    } catch {
      /* storage unavailable — level just won't be remembered */
    }
  };
  const [tcId, setTcIdState] = useState(() => {
    try {
      return tcById(localStorage.getItem(TC_KEY)).id;
    } catch {
      return 'none';
    }
  });
  const tc = tcById(tcId);
  const timed = tc.id !== 'none';
  const [gameTc, setGameTc] = useState(tc); // the control the current game is being played with
  const clock = useRef(freshClock(tc));
  const [flagged, setFlagged] = useState(null); // color that ran out of time
  const [, setTick] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState(null);
  const [viewPly, setViewPly] = useState(null); // null = live position
  const bot = getEngine('bot');
  const genRef = useRef(0); // bumps on new game / undo to drop stale bot moves

  const level = BOT_LEVELS.find((l) => l.id === levelId);
  const game = useMemo(() => replay(sans), [sans]);
  const viewGame = useMemo(() => (viewPly == null ? game : replay(sans.slice(0, viewPly))), [game, sans, viewPly]);
  const gameTimed = gameTc.id !== 'none';
  const timeoutResult = flagged
    ? (() => {
        // Losing on time is a draw if the other side can't possibly checkmate (lone king, or K+minor).
        const winner = flagged === 'w' ? 'b' : 'w';
        const left = game.board().flat().filter((p) => p && p.color === winner && p.type !== 'k');
        const cantMate = left.length === 0 || (left.length === 1 && 'nb'.includes(left[0].type));
        const loser = flagged === playerColor ? 'You' : level.name;
        if (cantMate) return `Draw — ${loser} ran out of time, but the other side can't checkmate`;
        return flagged === playerColor ? `⏱ You ran out of time — ${level.name} wins` : `⏱ ${level.name} ran out of time — you win!`;
      })()
    : null;
  const result = gameResult(game) ?? timeoutResult;
  const book = useMemo(() => lookupBook(sans), [sans]);
  const mat = useMemo(() => materialOf(viewGame), [viewGame]);
  const botColor = playerColor === 'w' ? 'b' : 'w';
  const myAdv = playerColor === 'w' ? mat.diff : -mat.diff;

  const liveMs = (c) => {
    const k = clock.current;
    return k.since != null && !result && game.turn() === c ? k[c] - (Date.now() - k.since) : k[c];
  };

  /** Stop the mover's clock and start the other side's (adds the increment). */
  function pressClock(mover) {
    if (!gameTimed) return;
    const k = clock.current;
    const now = Date.now();
    if (k.since != null) k[mover] = k[mover] - (now - k.since) + gameTc.inc * 1000;
    k.since = now; // White's first move is free; the clock starts after it
  }

  // Tick the display and watch for a flag fall.
  useEffect(() => {
    if (!gameTimed || result) return;
    const id = setInterval(() => {
      const turn = game.turn();
      if (clock.current.since != null && liveMs(turn) <= 0) {
        clock.current[turn] = 0;
        clock.current.since = null;
        genRef.current++;
        bot.stop();
        setThinking(false);
        setFlagged(turn);
      }
      setTick((t) => t + 1);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameTimed, result, game]);

  // Freeze the clock the moment the game ends.
  useEffect(() => {
    if (result) clock.current.since = null;
  }, [result]);

  // Bot's turn
  useEffect(() => {
    if (result || game.turn() === playerColor) return;
    const gen = genRef.current;
    setThinking(true);
    const started = Date.now();
    // On the clock, the bot budgets its time like a human would: ~1/30 of what's left plus most of the increment.
    let movetime = level.movetime;
    let minDelay = 350;
    if (gameTimed) {
      const left = liveMs(game.turn());
      const budget = Math.max(80, Math.min(left / 30 + gameTc.inc * 800, left / 4));
      movetime = Math.round(Math.min(movetime ?? budget, budget));
      if (left < 15000) minDelay = 0;
    }
    bot
      .search(game.fen(), { depth: level.depth, movetime, strength: level.strength })
      .then(async (res) => {
        if (!res || gen !== genRef.current) return;
        const wait = Math.max(0, minDelay - (Date.now() - started)); // tiny delay so fast levels feel natural
        await new Promise((r) => setTimeout(r, wait));
        if (gen !== genRef.current) return;
        const [san] = uciToSan(game.fen(), [res.bestmove], 1);
        if (san) {
          pressClock(game.turn());
          setSans((s) => [...s, san]);
        }
      })
      .finally(() => gen === genRef.current && setThinking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, playerColor, result, level, bot]);

  function onMove({ from, to, promotion }) {
    if (viewPly != null || result || game.turn() !== playerColor) return false;
    try {
      const g = replay(sans);
      const m = g.move({ from, to, promotion });
      pressClock(playerColor);
      setSans((s) => [...s, m.san]);
      setHint(null);
      return true;
    } catch {
      return false;
    }
  }

  function setTcId(id) {
    setTcIdState(id);
    try {
      localStorage.setItem(TC_KEY, id);
    } catch {
      /* storage unavailable */
    }
    // Before the first move, switch the current game over right away.
    if (sans.length === 0) {
      setGameTc(tcById(id));
      clock.current = freshClock(tcById(id));
    }
  }

  function newGame(color = playerColor) {
    genRef.current++;
    setGameTc(tc);
    clock.current = freshClock(tc);
    setFlagged(null);
    bot.stop();
    bot.newGame();
    setThinking(false);
    setSans([]);
    setHint(null);
    setViewPly(null);
    setPlayerColor(color);
  }

  function undo() {
    genRef.current++;
    if (clock.current.since != null) clock.current.since = Date.now(); // clock keeps the times already used
    bot.stop();
    setThinking(false);
    setHint(null);
    setViewPly(null);
    setSans((s) => {
      let n = s.length;
      // remove back to the most recent position where it's the player's turn
      do n--;
      while (n > 0 && (n % 2 === 0 ? 'w' : 'b') !== playerColor);
      return s.slice(0, Math.max(0, n));
    });
  }

  async function getHint() {
    const res = await getEngine('coach').search(game.fen(), { depth: 16 });
    if (!res) return;
    const [san] = uciToSan(game.fen(), [res.bestmove], 1);
    setHint({ uci: res.bestmove, san });
  }

  const arrows = hint && viewPly == null ? [{ startSquare: hint.uci.slice(0, 2), endSquare: hint.uci.slice(2, 4), color: 'rgba(40,180,90,.85)' }] : [];
  const status = result
    ? result
    : thinking
      ? `${level.name} is thinking…`
      : game.turn() === playerColor
        ? gameTimed && clock.current.since == null && playerColor === 'w'
          ? 'Your move — the clock starts after your first move'
          : 'Your move'
        : '';

  return (
    <div className="layout">
      <div className="board-col">
        <div className="player-tag">
          🤖 <span className="level-pill">Level {level.id}</span> {level.name} <span className="muted">({level.approx})</span>
          <CapturedRow m={mat} color={botColor} />
          {gameTimed && <Clock ms={liveMs(botColor)} running={!result && game.turn() === botColor && clock.current.since != null} flagged={flagged === botColor} />}
        </div>
        <Board
          fen={viewGame.fen()}
          orientation={playerColor === 'w' ? 'white' : 'black'}
          movableColor={viewPly == null && !result ? playerColor : null}
          onMove={onMove}
          arrows={arrows}
          lastMove={lastMoveOf(viewGame)}
        />
        <div className="player-tag">
          🙂 You <CapturedRow m={mat} color={playerColor} />
          {gameTimed && <Clock ms={liveMs(playerColor)} running={!result && game.turn() === playerColor && clock.current.since != null} flagged={flagged === playerColor} />}
        </div>
      </div>

      <aside className="panel">
        <div className="card">
          <h3>Play vs Stockfish</h3>
          <div className="pick-label">Bot strength</div>
          <div className="tile-grid levels">
            {BOT_LEVELS.map((l) => (
              <button
                key={l.id}
                className={`tile level-tile ${l.id === levelId ? 'active' : ''}`}
                style={{ '--hue': LEVEL_HUE[l.id - 1] }}
                onClick={() => setLevelId(l.id)}
                title={`Level ${l.id}: ${l.name} (${l.approx})`}
              >
                <span className="tile-icon">{LEVEL_ICON[l.id - 1]}</span>
                <span className="tile-name">{LEVEL_SHORT[l.id - 1]}</span>
                <span className="tile-sub">{l.approx}</span>
                <span className="pips">
                  {BOT_LEVELS.map((x) => (
                    <i key={x.id} className={x.id <= l.id ? 'on' : ''} />
                  ))}
                </span>
              </button>
            ))}
          </div>

          <div className="pick-label">Time control</div>
          <div className="tile-grid clocks">
            {TIME_CONTROLS.map((t) => (
              <button
                key={t.id}
                className={`tile tc-tile tc-${t.group.toLowerCase()} ${t.id === tcId ? 'active' : ''}`}
                onClick={() => setTcId(t.id)}
                title={t.label ?? `${t.group}: ${t.min} min${t.inc ? ` + ${t.inc} sec per move` : ''}`}
              >
                <ClockIcon tc={t} />
                <span className="tile-name">{t.min ? t.id : 'None'}</span>
                <span className="tile-sub">{t.group}</span>
              </button>
            ))}
          </div>
          {tc.id !== gameTc.id && <div className="muted small">Starts with your next new game.</div>}
          <div className="btn-row">
            <button className="btn primary" onClick={() => newGame('w')}>New game as White</button>
            <button className="btn primary" onClick={() => newGame('b')}>New game as Black</button>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={undo} disabled={sans.length === 0}>↶ Take back</button>
            <button className="btn" onClick={getHint} disabled={!!result || game.turn() !== playerColor}>💡 Hint</button>
            <button className="btn" onClick={() => onAnalyze(sans, playerColor)} disabled={sans.length === 0}>
              🔍 Review in Coach
            </button>
          </div>
        </div>

        <div className={`card status ${result ? 'over' : ''}`}>
          <strong>{status}</strong>
          {hint && <div>Hint: <b>{hint.san}</b> (green arrow)</div>}
          {book.best && (
            <div className="muted small">
              {book.inBook ? '📖 ' : 'Left book after: '}
              {book.best.openings.length > 1 ? book.best.openings.slice(0, 3).join(' / ') : `${book.best.line.openingName} — ${book.best.line.name}`}
            </div>
          )}
        </div>

        <div className="card material-card">
          <h3>Material</h3>
          <div>
            {myAdv === 0 ? (
              <strong>Even material</strong>
            ) : (
              <strong style={{ color: myAdv > 0 ? '#4ade80' : '#f87171' }}>
                {myAdv > 0 ? 'You' : level.name} {myAdv > 0 ? 'are' : 'is'} up {Math.abs(myAdv)} point{Math.abs(myAdv) === 1 ? '' : 's'}
              </strong>
            )}
          </div>
          {myAdv !== 0 && (() => {
            const ahead = myAdv > 0 ? playerColor : botColor;
            const extra = materialSummary(mat, ahead);
            return extra.length > 0 && <div className="muted small">Extra: {extra.join(', ')}</div>;
          })()}
          <div className="mat-bar" title="Your share of the material on the board">
            <div className={playerColor} style={{ width: `${(mat.points[playerColor] / Math.max(1, mat.points.w + mat.points.b)) * 100}%` }} />
            <div className={`${botColor} rest`} />
          </div>
          <div className="pts">
            <span>You: <b>{mat.points[playerColor]}</b> pts</span>
            <span>{level.name}: <b>{mat.points[botColor]}</b> pts</span>
          </div>
          <div className="muted points-key">Pawn 1 · Knight 3 · Bishop 3 · Rook 5 · Queen 9</div>
        </div>

        <div className="card grow">
          <div className="card-head">
            <h3>Moves</h3>
            {viewPly != null && (
              <button className="btn small" onClick={() => setViewPly(null)}>Back to live ▶</button>
            )}
          </div>
          <MoveList sans={sans} current={viewPly ?? sans.length} onJump={(p) => setViewPly(p === sans.length ? null : p)} />
        </div>
      </aside>
    </div>
  );
}
