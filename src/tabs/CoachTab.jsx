import { useEffect, useMemo, useRef, useState } from 'react';
import Board from '../components/Board';
import { EvalBar, MoveList, classifyLoss, gameResult, lastMoveOf, numbered, replay, uciToSan } from '../components/common';
import { getEngine } from '../engine/engines';
import { formatScore, scoreValue } from '../engine/Engine';
import { lookupBook } from '../data/openings';

const ARROW_COLORS = ['rgba(30,170,80,.9)', 'rgba(40,120,230,.75)', 'rgba(230,150,30,.6)'];

export default function CoachTab({ start, active }) {
  const [sans, setSans] = useState(start?.sans ?? []);
  const [myColor, setMyColor] = useState(start?.color ?? 'w');
  const [opponent, setOpponent] = useState('book'); // 'book' | 'engine' | 'manual'
  const [reveal, setReveal] = useState(true);
  const [allArrows, setAllArrows] = useState(false); // false = only the #1 move
  const [viewPly, setViewPly] = useState(null);
  const [analysis, setAnalysis] = useState({ fen: null, lines: [] });
  const [feedback, setFeedback] = useState(null);
  const [annotations, setAnnotations] = useState({});
  const [botThinking, setBotThinking] = useState(false);
  const genRef = useRef(0);
  const lastInfo = useRef(0);

  const coach = getEngine('coach');
  const grader = getEngine('grader');
  const bot = getEngine('bot');

  // Load a game sent from another tab
  useEffect(() => {
    if (!start) return;
    genRef.current++;
    setSans(start.sans);
    setMyColor(start.color);
    setViewPly(null);
    setAnnotations({});
    setFeedback(null);
    if (start.opponent) setOpponent(start.opponent);
  }, [start]);

  const ply = viewPly ?? sans.length;
  const shown = useMemo(() => sans.slice(0, ply), [sans, ply]);
  const game = useMemo(() => replay(shown), [shown]);
  const fen = game.fen();
  const turn = game.turn();
  const result = gameResult(game);
  const book = useMemo(() => lookupBook(shown), [shown]);
  const live = viewPly == null;
  const myTurn = opponent === 'manual' || turn === myColor;

  // Continuous analysis of the shown position (top 3 moves)
  useEffect(() => {
    if (result) {
      coach.stop();
      setAnalysis({ fen, lines: [] });
      return;
    }
    setAnalysis({ fen, lines: [] });
    lastInfo.current = 0;
    coach.search(fen, {
      multipv: 3,
      depth: 20,
      // Throttle UI updates: the engine reports many times a second, the panel only needs ~4/sec.
      onInfo: (lines) => {
        const now = performance.now();
        if (now - lastInfo.current < 250) return;
        lastInfo.current = now;
        setAnalysis({ fen, lines: lines.slice() });
      },
    }).then((res) => {
      if (res) setAnalysis({ fen, lines: res.lines.slice() });
    });
  }, [fen, result, coach]);

  // Opponent reply (only in live position)
  useEffect(() => {
    if (!live || result || opponent === 'manual' || turn === myColor) return;
    const gen = genRef.current;
    let cancelled = false;
    setBotThinking(true);
    (async () => {
      await new Promise((r) => setTimeout(r, 450));
      if (cancelled || gen !== genRef.current) return;
      let san = null;
      if (opponent === 'book' && book.inBook && book.next.length) {
        // Pick a book move, weighted toward the most common continuation.
        const weighted = book.next.flatMap((n) => Array(n.lines.length).fill(n.san));
        san = weighted[Math.floor(Math.random() * weighted.length)];
      } else {
        const res = await bot.search(fen, { movetime: 900 });
        if (!res || cancelled || gen !== genRef.current) return;
        san = uciToSan(fen, [res.bestmove], 1)[0];
      }
      if (san && !cancelled && gen === genRef.current) setSans((s) => [...s, san]);
    })().finally(() => !cancelled && setBotThinking(false));
    return () => {
      cancelled = true;
      setBotThinking(false);
    };
  }, [live, result, opponent, turn, myColor, fen, book, bot]);

  const lines = analysis.fen === fen ? analysis.lines : [];

  function onMove({ from, to, promotion }) {
    if (result || !myTurn) return false;
    const g = replay(shown);
    let m;
    try {
      m = g.move({ from, to, promotion });
    } catch {
      return false;
    }
    const plyIndex = shown.length;
    const before = { fen, turn, lines, bookNext: book.inBook ? book.next.map((n) => n.san) : [] };
    genRef.current++;
    setSans([...shown, m.san]);
    setViewPly(null);
    gradeMove(before, m, g.fen(), plyIndex);
    return true;
  }

  async function gradeMove(before, m, afterFen, plyIndex) {
    const uci = m.from + m.to + (m.promotion || '');
    const isBook = before.bookNext.includes(m.san);
    const best = before.lines[0];
    let fb;
    if (!best) {
      fb = isBook ? { label: 'Book move', sym: '📖', cls: 'book' } : null;
    } else {
      const bestVal = scoreValue(best, before.turn, before.turn);
      const match = before.lines.find((l) => l.pv[0] === uci);
      let val;
      if (match) val = scoreValue(match, before.turn, before.turn);
      else {
        const res = await grader.search(afterFen, { depth: 13 });
        if (!res || !res.lines[0]) return;
        val = scoreValue(res.lines[0], before.turn === 'w' ? 'b' : 'w', before.turn);
      }
      const loss = Math.max(0, bestVal - val);
      const cls = isBook && loss < 60 ? { label: 'Book move', sym: '📖', cls: 'book' } : classifyLoss(loss, best.pv[0] === uci);
      const bestSan = uciToSan(before.fen, [best.pv[0]], 1)[0];
      fb = { ...cls, san: m.san, bestSan, loss, isTop: best.pv[0] === uci, bestLine: numbered(uciToSan(before.fen, best.pv, 8), plyIndex) };
    }
    if (!fb) return;
    setFeedback({ ...fb, san: m.san, plyIndex });
    setAnnotations((a) => ({ ...a, [plyIndex]: fb }));
  }

  function jump(p) {
    genRef.current++;
    setViewPly(p >= sans.length ? null : p);
  }
  function step(d) {
    jump(Math.min(sans.length, Math.max(0, ply + d)));
  }
  function playSan(san) {
    const g = replay(shown);
    const m = g.move(san);
    onMove({ from: m.from, to: m.to, promotion: m.promotion });
  }
  function reset(color = myColor) {
    genRef.current++;
    bot.stop();
    bot.newGame();
    setSans([]);
    setViewPly(null);
    setAnnotations({});
    setFeedback(null);
    setMyColor(color);
  }
  function takeBack() {
    genRef.current++;
    let n = shown.length;
    if (opponent !== 'manual') {
      do n--;
      while (n > 0 && (n % 2 === 0 ? 'w' : 'b') !== myColor);
    } else n--;
    n = Math.max(0, n);
    setSans(shown.slice(0, n));
    setViewPly(null);
    setFeedback(null);
  }

  // keyboard arrows to step through moves
  useEffect(() => {
    const h = (e) => {
      if (!active || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const showSuggestions = reveal && (myTurn || !live);
  const arrows = showSuggestions
    ? lines.slice(0, allArrows ? 3 : 1).map((l, i) => ({ startSquare: l.pv[0].slice(0, 2), endSquare: l.pv[0].slice(2, 4), color: ARROW_COLORS[i] }))
    : [];
  const depth = lines[0]?.depth ?? 0;

  return (
    <div className="layout">
      <div className="board-col">
        <div className="board-with-eval">
          <EvalBar line={lines[0]} turn={turn} orientation={myColor === 'w' ? 'white' : 'black'} />
          <Board
            fen={fen}
            orientation={myColor === 'w' ? 'white' : 'black'}
            movableColor={result ? null : opponent === 'manual' ? 'both' : myColor}
            onMove={onMove}
            arrows={arrows}
            lastMove={lastMoveOf(game)}
          />
        </div>
        <div className="btn-row center">
          <button className="btn" onClick={() => jump(0)}>⏮</button>
          <button className="btn" onClick={() => step(-1)}>◀</button>
          <button className="btn" onClick={() => step(1)}>▶</button>
          <button className="btn" onClick={() => jump(sans.length)}>⏭</button>
          <button className="btn" onClick={takeBack} disabled={!shown.length}>↶ Take back</button>
          <button className="btn" onClick={() => reset()} disabled={!sans.length}>↺ New game</button>
        </div>
      </div>

      <aside className="panel">
        <div className="card">
          <h3>Best-Move Coach</h3>
          <div className="btn-row">
            <button className="btn primary" onClick={() => reset('w')}>↺ New game as White</button>
            <button className="btn primary" onClick={() => reset('b')}>↺ New game as Black</button>
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            You're playing {myColor === 'w' ? 'White' : 'Black'}.
          </div>
          <label className="field">
            Opponent
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)}>
              <option value="book">Plays opening theory, then Stockfish</option>
              <option value="engine">Stockfish from move 1</option>
              <option value="manual">Nobody — I move both sides</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
            Show best moves (turn off to guess first)
          </label>
          <label className="check">
            <input type="checkbox" checked={allArrows} onChange={(e) => setAllArrows(e.target.checked)} disabled={!reveal} />
            Arrows for the top 3 moves (off = only the #1 move)
          </label>
        </div>

        {feedback && (
          <div className={`card feedback ${feedback.cls}`}>
            <div className="muted small">Your last move</div>
            <div className="fb-title">
              <span className={`tag big ${feedback.cls}`}>{feedback.sym}</span>
              <b>{feedback.san}</b>&nbsp;— {feedback.label}
            </div>
            {feedback.bestSan && (
              <div className="small">
                {feedback.isTop ? (
                  <>This was the engine's #1 move. 👍</>
                ) : feedback.loss <= 20 ? (
                  <>
                    The engine's #1 was <b>{feedback.bestSan}</b>, but your move is about as good.
                  </>
                ) : (
                  <>
                    Better was <b>{feedback.bestSan}</b>. Your move gave up about {(feedback.loss / 100).toFixed(1)} pawns of value.
                  </>
                )}
                {!feedback.isTop && <div className="muted pv">Engine line: {feedback.bestLine}</div>}
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <h3>{result ? result : myTurn ? (live ? 'Your move — engine\'s top 3' : 'Engine\'s top 3 here') : botThinking ? 'Opponent is thinking…' : 'Opponent to move'}</h3>
            <span className="muted small">depth {depth}</span>
          </div>
          {!result && (
            reveal || !myTurn ? (
              <ol className="lines">
                {lines.length === 0 && <li className="muted">Thinking…</li>}
                {lines.map((l, i) => {
                  const pvSan = uciToSan(fen, l.pv, 10);
                  return (
                    <li key={i} className="line" onClick={() => myTurn && pvSan[0] && playSan(pvSan[0])} title={myTurn ? 'Click to play this move' : ''}>
                      <span className="rank" style={{ background: i === 0 || allArrows ? ARROW_COLORS[i] : '#444' }}>#{i + 1}</span>
                      <span className="score">{formatScore(l, turn)}</span>
                      <b className="san">{pvSan[0]}</b>
                      <span className="muted pv">{numbered(pvSan, shown.length)}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <button className="btn" onClick={() => setReveal(true)}>Reveal best moves</button>
            )
          )}
        </div>

        <div className="card">
          <h3>📖 Opening book</h3>
          {book.best ? (
            <div className="small">
              {book.best.openings.length > 1 ? (
                <>
                  <b>Could become:</b> {book.best.openings.join(', ')}
                </>
              ) : (
                <>
                  <b>{book.best.line.openingName}</b> — {book.best.line.name}
                  {!book.inBook && <span className="muted"> (you've left the book line)</span>}
                  <div className="muted">{book.best.line.idea}</div>
                </>
              )}
            </div>
          ) : (
            <div className="muted small">
              {shown.length === 0 ? 'Starting position — pick any first move.' : 'This position isn\'t in the opening book.'}
            </div>
          )}
          {book.inBook && book.next.length > 0 && (
            <div className="book-next">
              <span className="small muted">Theory continues: </span>
              {book.next.map((n) => (
                <button
                  key={n.san}
                  className="chip"
                  disabled={!myTurn}
                  onClick={() => playSan(n.san)}
                  title={n.lines.map((l) => `${l.openingName}: ${l.name}`).join('\n')}
                >
                  {n.san} <span className="muted">· {n.lines[0].openingName}{n.lines.length > 1 ? ` +${n.lines.length - 1}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card grow">
          <h3>Moves</h3>
          <MoveList sans={sans} current={ply} onJump={jump} annotations={annotations} />
        </div>
      </aside>
    </div>
  );
}
