import { useEffect, useMemo, useState } from 'react';
import { BOT_LEVELS } from '../engine/Engine';
import { ALL_LINES } from '../data/openings';
import { LineChart } from '../components/charts';
import { ResultBadge, eloBand } from '../analysis/GameReview';
import { requestAnalysis, useGameRecord } from '../analysis/analyze';
import { loadGames, pkey } from '../profile/store';
import { byColor, byLevel, byOpening, insights, phaseSummary, ratingAt, ratingSummary } from '../profile/stats';

function Delta({ v, good = 'up', unit = '' }) {
  if (v == null || v === 0) return null;
  const isGood = good === 'up' ? v > 0 : v < 0;
  return <span className={`delta ${isGood ? 'up' : 'down'}`}>{v > 0 ? '▲' : '▼'} {Math.abs(v)}{unit}</span>;
}

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(pkey(key))) ?? null;
  } catch {
    return null;
  }
}

function AnalyzingNote({ games, profileId }) {
  const pending = games.filter((g) => !g.analysis);
  const first = pending[0];
  const { progress } = useGameRecord(profileId, first?.id);
  if (!pending.length) return null;
  return (
    <div className="muted small">
      ⏳ Analyzing {pending.length} game{pending.length === 1 ? '' : 's'}… {progress != null && `${Math.round(progress * 100)}%`}
    </div>
  );
}

export default function ProgressTab({ profile, active, onReview }) {
  const [games, setGames] = useState(() => loadGames(profile.id));
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const h = () => setGames(loadGames(profile.id));
    h();
    window.addEventListener('games-changed', h);
    return () => window.removeEventListener('games-changed', h);
  }, [profile.id, active]);

  // Finish analyzing any games that missed it (e.g. the page was closed mid-analysis).
  useEffect(() => {
    if (active) games.filter((g) => !g.analysis).forEach(requestAnalysis);
  }, [active, games]);

  const s = useMemo(() => ratingSummary(games), [games]);
  const phases = useMemo(() => phaseSummary(games), [games]);
  const levels = useMemo(() => byLevel(games), [games]);
  const openings = useMemo(() => byOpening(games), [games]);
  const colors = useMemo(() => byColor(games), [games]);
  const tips = useMemo(() => insights(games), [games]);

  const rated = games.map((g, i) => ({ g, i })).filter(({ g }) => g.analysis?.[g.playerColor]?.estElo);
  const ratingPoints = rated.map(({ g, i }) => ({
    y: ratingAt(games, i + 1),
    label: new Date(g.date).toLocaleDateString(),
    sub: `This game: ~${g.analysis[g.playerColor].estElo} · ${g.outcome} vs Level ${g.levelId}`,
    id: g.id,
  }));
  const accPoints = games
    .filter((g) => g.analysis?.[g.playerColor]?.accuracy != null)
    .map((g) => ({ y: g.analysis[g.playerColor].accuracy, label: new Date(g.date).toLocaleDateString(), sub: `${g.outcome} vs Level ${g.levelId}`, id: g.id }));

  const openingProgress = readJSON('chess-trainer-progress-v1') ?? {};
  const mastered = ALL_LINES.filter((l) => (openingProgress[l.id]?.perfect ?? 0) >= 3).length;
  const drilled = ALL_LINES.filter((l) => openingProgress[l.id]?.runs).length;
  const squares = readJSON('chess-trainer-squares-v1');
  const sqBest = (k) => (squares?.best?.[k] ? `${(squares.best[k] / 1000).toFixed(1)}s` : '—');

  const recent = [...games].reverse().slice(0, showAll ? 400 : 12);
  const since = new Date(profile.created).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="progress-page">
      <div className="progress-hero" style={{ '--pc': profile.color }}>
        <span className="avatar huge">{profile.avatar}</span>
        <div>
          <h1>{profile.name}</h1>
          <div className="muted">Playing since {since}</div>
          <AnalyzingNote games={games} profileId={profile.id} />
        </div>
        <div className="hero-rating">
          <div className="muted small">Estimated rating</div>
          <div className="big-num">{s.rating ? `~${s.rating}` : '—'}</div>
          <div className="small">{s.rating ? eloBand(s.rating) : 'Play a few games to get a rating'} <Delta v={s.ratingChange} /></div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="card empty-state">
          <h3>No games yet</h3>
          <p className="muted">Play a game against the bot in <b>♟ Play vs Bot</b>. When it ends, Stockfish reviews every move, and your stats, estimated rating and trends show up here.</p>
        </div>
      ) : (
        <>
          <div className="stat-tiles">
            <div className="stat"><span>Games</span><b>{s.games}</b><small>{s.wins}W · {s.losses}L · {s.draws}D</small></div>
            <div className="stat"><span>Score</span><b>{s.winRate}%</b><small>wins + ½ draws</small></div>
            <div className="stat"><span>Accuracy (last 10)</span><b>{s.accuracy != null ? `${s.accuracy}%` : '—'}</b><small><Delta v={s.accuracyChange} unit="%" /> {s.accuracyChange != null ? 'vs previous 10' : ''}</small></div>
            <div className="stat"><span>Blunders / game</span><b>{s.blunders ?? '—'}</b><small><Delta v={s.blundersChange} good="down" /></small></div>
            <div className="stat"><span>Best win</span><b>{s.bestWinLevel ? `Level ${s.bestWinLevel}` : '—'}</b><small>{s.bestWinLevel ? BOT_LEVELS.find((l) => l.id === s.bestWinLevel)?.name : 'no wins yet'}</small></div>
            <div className="stat"><span>Streak</span><b>{s.streak ? `${s.streak.n} ${s.streak.outcome === 'win' ? 'W' : s.streak.outcome === 'loss' ? 'L' : 'D'}` : '—'}</b><small>{s.streak?.outcome === 'win' && s.streak.n >= 2 ? '🔥 on fire' : 'current run'}</small></div>
          </div>

          {tips.length > 0 && (
            <div className="card tips">
              <h3>💡 What the numbers say</h3>
              <ul>{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}

          <div className="grid-2">
            <div className="card">
              <h3>Estimated rating over time</h3>
              <LineChart points={ratingPoints} yFmt={(v) => `${v}`} onPick={(i) => onReview(ratingPoints[i].id)} empty="Needs a game with at least 8 of your moves." />
            </div>
            <div className="card">
              <h3>Accuracy per game</h3>
              <LineChart points={accPoints} color="#3fbf6f" yFmt={(v) => `${v}%`} yMin={0} yMax={100} onPick={(i) => onReview(accPoints[i].id)} />
            </div>
          </div>

          <div className="grid-3">
            <div className="card">
              <h3>Accuracy by phase</h3>
              {['opening', 'middlegame', 'endgame'].map((ph) => (
                <div className="bar-row" key={ph}>
                  <span>{ph[0].toUpperCase() + ph.slice(1)}</span>
                  <div className="hbar"><div style={{ width: `${phases[ph] ?? 0}%` }} /></div>
                  <b>{phases[ph] != null ? `${phases[ph]}%` : '—'}</b>
                </div>
              ))}
              <div className="muted small">Last 15 analyzed games.</div>
            </div>

            <div className="card">
              <h3>Results by bot level</h3>
              {levels.map((r) => {
                const n = r.win + r.loss + r.draw;
                const l = BOT_LEVELS.find((x) => x.id === r.levelId);
                return (
                  <div className="bar-row" key={r.levelId} title={`${r.win} wins, ${r.draw} draws, ${r.loss} losses`}>
                    <span>L{r.levelId} {l?.name}</span>
                    <div className="wdl">
                      <div className="w" style={{ flex: r.win }} />
                      <div className="d" style={{ flex: r.draw }} />
                      <div className="l" style={{ flex: r.loss }} />
                    </div>
                    <b>{r.win}/{n}</b>
                  </div>
                );
              })}
              <div className="legend small"><i className="w" /> Win <i className="d" /> Draw <i className="l" /> Loss</div>
            </div>

            <div className="card">
              <h3>By color & opening</h3>
              <div className="bar-row"><span>As White</span><div className="hbar"><div style={{ width: `${colors.w.pct ?? 0}%` }} /></div><b>{colors.w.n ? `${colors.w.pct}%` : '—'}</b></div>
              <div className="bar-row"><span>As Black</span><div className="hbar"><div style={{ width: `${colors.b.pct ?? 0}%` }} /></div><b>{colors.b.n ? `${colors.b.pct}%` : '—'}</b></div>
              <div className="openings-list">
                {openings.length === 0 && <div className="muted small">No book openings recognized yet.</div>}
                {openings.map((o) => (
                  <div key={o.name} className="small op-row">
                    <span>{o.name}</span>
                    <span className="muted">{o.win}W {o.draw}D {o.loss}L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Training</h3>
          <div className="bar-row">
            <span>Opening lines mastered</span>
            <div className="hbar gold"><div style={{ width: `${(mastered / ALL_LINES.length) * 100}%` }} /></div>
            <b>{mastered}/{ALL_LINES.length}</b>
          </div>
          <div className="muted small">{drilled} lines drilled at least once.</div>
          <div className="sq-bests">
            <div><span>Find 20 squares</span><b>{sqBest('find-20-w')}</b></div>
            <div><span>Name 20 squares</span><b>{sqBest('name-20-w')}</b></div>
            <div><span>Find 20 (mixed sides)</span><b>{sqBest('find-20-mix')}</b></div>
          </div>
        </div>

        {games.length > 0 && (
          <div className="card">
            <div className="card-head">
              <h3>Recent games</h3>
              {games.length > 12 && <button className="btn small" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show fewer' : `Show all ${games.length}`}</button>}
            </div>
            <div className="game-list">
              {recent.map((g) => {
                const me = g.analysis?.[g.playerColor];
                return (
                  <button key={g.id} className="game-row" onClick={() => onReview(g.id)}>
                    <ResultBadge outcome={g.outcome} />
                    <span className="gr-main">
                      <b>vs Level {g.levelId}</b> <span className="muted">{g.playerColor === 'w' ? '♔ White' : '♚ Black'} · {g.tc === 'none' ? 'untimed' : g.tc} · {Math.ceil(g.sans.length / 2)} moves</span>
                      <span className="muted small">{new Date(g.date).toLocaleDateString()} · {g.reason}{g.opening ? ` · ${g.opening}` : ''}</span>
                    </span>
                    <span className="gr-stats">
                      {me ? (
                        <>
                          <b>{me.accuracy}%</b>
                          <span className="muted small">{me.estElo ? `~${me.estElo}` : 'short'}</span>
                        </>
                      ) : (
                        <span className="muted small">analyzing…</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
