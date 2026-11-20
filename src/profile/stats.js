// Aggregate stats over a player's saved games.

const analysedSide = (g) => g.analysis?.[g.playerColor] ?? null;

/** Estimated rating: recency-weighted average of per-game estimates (longer games count more). */
export function ratingAt(games, uptoIndex = games.length) {
  const rated = games.slice(0, uptoIndex).filter((g) => analysedSide(g)?.estElo);
  const recent = rated.slice(-10).reverse();
  if (!recent.length) return null;
  let sum = 0;
  let wsum = 0;
  recent.forEach((g, k) => {
    const s = analysedSide(g);
    const w = Math.pow(0.85, k) * Math.min(1, s.moves / 25);
    sum += s.estElo * w;
    wsum += w;
  });
  return Math.round(sum / wsum / 25) * 25;
}

export function ratingSummary(games) {
  const wins = games.filter((g) => g.outcome === 'win').length;
  const losses = games.filter((g) => g.outcome === 'loss').length;
  const draws = games.filter((g) => g.outcome === 'draw').length;
  const analysed = games.filter(analysedSide);
  const last10 = analysed.slice(-10);
  const prev10 = analysed.slice(-20, -10);
  const avg = (arr, f) => (arr.length ? arr.reduce((s, g) => s + f(g), 0) / arr.length : null);
  const accuracy = avg(last10, (g) => analysedSide(g).accuracy);
  const prevAccuracy = avg(prev10, (g) => analysedSide(g).accuracy);
  const blunders = avg(last10, (g) => analysedSide(g).counts.blunder);
  const prevBlunders = avg(prev10, (g) => analysedSide(g).counts.blunder);
  const rating = ratingAt(games);
  const ratingBefore = ratingAt(games, Math.max(0, games.length - 5));

  // Streak of consecutive results, newest first.
  let streak = null;
  for (let i = games.length - 1; i >= 0; i--) {
    const o = games[i].outcome;
    if (!streak) streak = { outcome: o, n: 1 };
    else if (o === streak.outcome) streak.n++;
    else break;
  }

  const beaten = games.filter((g) => g.outcome === 'win').map((g) => g.levelId);
  return {
    games: games.length,
    wins,
    losses,
    draws,
    winRate: games.length ? Math.round(((wins + draws / 2) / games.length) * 100) : null,
    rating,
    ratingChange: rating && ratingBefore ? rating - ratingBefore : null,
    accuracy: accuracy == null ? null : Math.round(accuracy),
    accuracyChange: accuracy != null && prevAccuracy != null ? Math.round(accuracy - prevAccuracy) : null,
    blunders: blunders == null ? null : Math.round(blunders * 10) / 10,
    blundersChange: blunders != null && prevBlunders != null ? Math.round((blunders - prevBlunders) * 10) / 10 : null,
    streak,
    bestWinLevel: beaten.length ? Math.max(...beaten) : null,
  };
}

/** Accuracy by game phase across recent games — where are points being lost? */
export function phaseSummary(games) {
  const out = {};
  for (const ph of ['opening', 'middlegame', 'endgame']) {
    const vals = games
      .map((g) => analysedSide(g)?.phases?.[ph])
      .filter(Boolean)
      .slice(-15);
    out[ph] = vals.length ? Math.round(vals.reduce((s, v) => s + v.accuracy, 0) / vals.length) : null;
  }
  return out;
}

export function byLevel(games) {
  const m = new Map();
  for (const g of games) {
    const r = m.get(g.levelId) ?? { levelId: g.levelId, win: 0, loss: 0, draw: 0 };
    r[g.outcome]++;
    m.set(g.levelId, r);
  }
  return [...m.values()].sort((a, b) => a.levelId - b.levelId);
}

export function byOpening(games) {
  const m = new Map();
  for (const g of games) {
    if (!g.opening) continue;
    const r = m.get(g.opening) ?? { name: g.opening, win: 0, loss: 0, draw: 0, n: 0 };
    r[g.outcome]++;
    r.n++;
    m.set(g.opening, r);
  }
  return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 6);
}

export function byColor(games) {
  const out = {};
  for (const c of ['w', 'b']) {
    const gs = games.filter((g) => g.playerColor === c);
    const score = gs.reduce((s, g) => s + (g.outcome === 'win' ? 1 : g.outcome === 'draw' ? 0.5 : 0), 0);
    out[c] = { n: gs.length, pct: gs.length ? Math.round((score / gs.length) * 100) : null };
  }
  return out;
}

/** A few plain-English observations for the progress page. */
export function insights(games) {
  const tips = [];
  const s = ratingSummary(games);
  const ph = phaseSummary(games);
  const phases = Object.entries(ph).filter(([, v]) => v != null);
  if (phases.length >= 2 && games.filter((g) => g.analysis).length >= 3) {
    const worst = phases.reduce((a, b) => (b[1] < a[1] ? b : a));
    const best = phases.reduce((a, b) => (b[1] > a[1] ? b : a));
    if (best[1] - worst[1] >= 5)
      tips.push(`Your ${worst[0]} is your weakest phase (${worst[1]}% accuracy vs ${best[1]}% in the ${best[0]}).${worst[0] === 'opening' ? ' The Openings tab drills will help.' : worst[0] === 'endgame' ? ' Try playing endgames out in the Coach with the engine.' : ' Slow down and check every capture and check before you move.'}`);
  }
  if (s.blundersChange != null && s.blundersChange < 0) tips.push(`You're blundering less: ${s.blunders} per game lately, down ${Math.abs(s.blundersChange)}.`);
  else if (s.blunders != null && s.blunders >= 2) tips.push(`About ${s.blunders} blunders per game. Before each move, ask: "What does my opponent threaten?"`);
  const col = byColor(games);
  if (col.w.n >= 3 && col.b.n >= 3 && Math.abs(col.w.pct - col.b.pct) >= 15)
    tips.push(`You score better with ${col.w.pct > col.b.pct ? 'White' : 'Black'} (${Math.max(col.w.pct, col.b.pct)}% vs ${Math.min(col.w.pct, col.b.pct)}%).`);
  if (s.streak?.outcome === 'win' && s.streak.n >= 3) tips.push(`🔥 ${s.streak.n} wins in a row — time to try a stronger bot?`);
  return tips;
}
