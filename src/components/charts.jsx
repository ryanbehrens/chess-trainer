import { useEffect, useRef, useState } from 'react';
import { winPct } from '../analysis/analyze';

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/**
 * Single-series line chart with a hover crosshair + tooltip.
 * points: [{ y, label, sub }]  (label/sub appear in the tooltip)
 */
export function LineChart({ points, height = 170, color = 'var(--accent)', yFmt = (v) => v, yMin, yMax, onPick, empty = 'No data yet' }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  if (!points.length) return <div className="chart-empty muted small">{empty}</div>;

  const pad = { l: 40, r: 12, t: 12, b: 20 };
  const ys = points.map((p) => p.y);
  let lo = yMin ?? Math.min(...ys);
  let hi = yMax ?? Math.max(...ys);
  if (hi - lo < 1) {
    lo -= 50;
    hi += 50;
  }
  const span = hi - lo;
  lo -= span * 0.08;
  hi += span * 0.08;
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const x = (i) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * ih;
  const ticks = [0, 0.5, 1].map((f) => lo + span * 0.08 + f * span);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = points.length === 1 ? 0 : Math.round(((px - pad.l) / iw) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onClick={() => hover != null && onPick?.(hover)} style={{ cursor: onPick ? 'pointer' : 'default' }}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className="grid" />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="axis">{yFmt(Math.round(t))}</text>
            </g>
          ))}
          <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.y)} r={points.length > 40 ? 2 : 3.5} fill={color} stroke="var(--card)" strokeWidth="2" />
          ))}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="crosshair" />
              <circle cx={x(hover)} cy={y(points[hover].y)} r="5" fill={color} stroke="var(--card)" strokeWidth="2" />
            </g>
          )}
        </svg>
      )}
      {hover != null && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: Math.max(0, y(points[hover].y) - 54) }}>
          <b>{yFmt(points[hover].y)}</b>
          <div>{points[hover].label}</div>
          {points[hover].sub && <div className="muted">{points[hover].sub}</div>}
        </div>
      )}
    </div>
  );
}

const DOT = { blunder: '#e5534b', mistake: '#f97316', inaccuracy: '#e5b93a' };

/** Evaluation over the game: white area = White's winning chances. Click to jump to a move. */
export function EvalGraph({ evals, moves, current, onPick, height = 120 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const n = evals.length;
  const x = (i) => (n === 1 ? 0 : (i / (n - 1)) * width);
  const y = (cp) => (1 - winPct(cp) / 100) * height;
  const area = width ? `M0,${height} ` + evals.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ') + ` L${width},${height} Z` : '';

  const plyAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / width) * (n - 1))));
  };
  const fmt = (cp) => (Math.abs(cp) >= 1500 ? (cp > 0 ? 'White winning' : 'Black winning') : `${cp > 0 ? '+' : ''}${(cp / 100).toFixed(1)}`);
  const tipMove = hover > 0 ? moves[hover - 1] : null;

  return (
    <div className="chart eval-graph" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={(e) => setHover(plyAt(e))} onMouseLeave={() => setHover(null)} onClick={(e) => onPick?.(plyAt(e))}>
          <rect width={width} height={height} className="eg-black" />
          <path d={area} className="eg-white" />
          <line x1="0" x2={width} y1={height / 2} y2={height / 2} className="eg-mid" />
          {current != null && <line x1={x(current)} x2={x(current)} y1="0" y2={height} className="eg-current" />}
          {moves.map((m, i) =>
            DOT[m.cls] ? <circle key={i} cx={x(i + 1)} cy={y(evals[i + 1])} r="4" fill={DOT[m.cls]} stroke="#111" strokeWidth="1.5" /> : null,
          )}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={height} className="crosshair" />}
        </svg>
      )}
      {hover != null && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: 4 }}>
          <b>{fmt(evals[hover])}</b>
          <div>{tipMove ? `${Math.floor((hover - 1) / 2) + 1}${tipMove.color === 'w' ? '.' : '…'} ${tipMove.san}` : 'Start'}</div>
          {tipMove && DOT[tipMove.cls] && <div style={{ color: DOT[tipMove.cls] }}>{tipMove.cls}</div>}
        </div>
      )}
    </div>
  );
}
