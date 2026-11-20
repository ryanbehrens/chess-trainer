// Thin promise-based wrapper around the Stockfish WASM Web Worker (UCI protocol).
// Each Engine owns its own worker, so the bot, the coach and the move-grader never block each other.

const ENGINE_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

export class Engine {
  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.listeners = new Set();
    this.worker.onmessage = (e) => {
      const line = typeof e.data === 'string' ? e.data : String(e.data ?? '');
      this.listeners.forEach((l) => l(line));
    };
    this.queue = Promise.resolve();
    this.latestId = 0;
    this.running = false;
    this.ready = this.waitFor('uci', 'uciok').then(() => this.waitFor('isready', 'readyok'));
  }

  send(cmd) {
    this.worker.postMessage(cmd);
  }

  waitFor(cmd, token) {
    return new Promise((resolve) => {
      const l = (line) => {
        if (line.startsWith(token)) {
          this.listeners.delete(l);
          resolve(line);
        }
      };
      this.listeners.add(l);
      this.send(cmd);
    });
  }

  newGame() {
    this.queue = this.queue.then(async () => {
      await this.ready;
      this.send('ucinewgame');
      await this.waitFor('isready', 'readyok');
    });
  }

  /**
   * Search a position. A newer call cancels any older one (the older promise resolves to null).
   * @param {string} fen
   * @param {object} opts { multipv, depth, movetime, strength, onInfo }
   *   strength: { skill?: 0-20, elo?: number } — omitted means full strength.
   * @returns {Promise<{bestmove: string, lines: Array}|null>}
   */
  search(fen, opts = {}) {
    const id = ++this.latestId;
    if (this.running) this.send('stop');

    const job = this.queue.then(async () => {
      if (id !== this.latestId) return null; // superseded before it started
      await this.ready;
      const { multipv = 1, depth, movetime, strength, onInfo } = opts;

      this.send(`setoption name MultiPV value ${multipv}`);
      if (strength?.elo) {
        this.send('setoption name Skill Level value 20');
        this.send('setoption name UCI_LimitStrength value true');
        this.send(`setoption name UCI_Elo value ${strength.elo}`);
      } else {
        this.send('setoption name UCI_LimitStrength value false');
        this.send(`setoption name Skill Level value ${strength?.skill ?? 20}`);
      }
      await this.waitFor('isready', 'readyok');
      if (id !== this.latestId) return null;

      this.send(`position fen ${fen}`);
      const lines = [];
      return new Promise((resolve) => {
        const l = (line) => {
          if (line.startsWith('info') && line.includes(' pv ')) {
            const parsed = parseInfo(line);
            if (parsed) {
              lines[parsed.multipv - 1] = parsed;
              if (id === this.latestId && onInfo) onInfo(lines.filter(Boolean));
            }
          } else if (line.startsWith('bestmove')) {
            this.listeners.delete(l);
            this.running = false;
            const bestmove = line.split(' ')[1];
            resolve(id === this.latestId ? { bestmove, lines: lines.filter(Boolean) } : null);
          }
        };
        this.listeners.add(l);
        this.running = true;
        if (movetime && depth) this.send(`go depth ${depth} movetime ${movetime}`); // whichever comes first
        else if (movetime) this.send(`go movetime ${movetime}`);
        else this.send(`go depth ${depth ?? 14}`);
      });
    });
    this.queue = job.catch(() => {});
    return job;
  }

  stop() {
    this.latestId++;
    if (this.running) this.send('stop');
  }

  terminate() {
    this.worker.terminate();
  }
}

function parseInfo(line) {
  const t = line.split(' ');
  const get = (key) => {
    const i = t.indexOf(key);
    return i >= 0 ? t[i + 1] : undefined;
  };
  const si = t.indexOf('score');
  if (si < 0) return null;
  const kind = t[si + 1];
  const val = parseInt(t[si + 2], 10);
  const pvIdx = t.indexOf('pv');
  return {
    depth: parseInt(get('depth'), 10),
    multipv: parseInt(get('multipv') ?? '1', 10),
    cp: kind === 'cp' ? val : null,
    mate: kind === 'mate' ? val : null,
    pv: t.slice(pvIdx + 1),
  };
}

// Convert a side-to-move score to a single number from the given side's perspective (mate = ±10000).
export function scoreValue(line, sideToMove, perspective) {
  if (!line) return 0;
  let v = line.mate != null ? (line.mate > 0 ? 10000 - line.mate : -10000 - line.mate) : line.cp;
  if (line.mate === 0) v = -10000; // side to move is mated
  return sideToMove === perspective ? v : -v;
}

export function formatScore(line, sideToMove) {
  if (!line) return '…';
  // Always show from White's perspective, like most chess sites.
  const sign = sideToMove === 'w' ? 1 : -1;
  if (line.mate != null) {
    const m = line.mate * sign;
    return m > 0 ? `M${Math.abs(m)}` : `-M${Math.abs(m)}`;
  }
  const cp = (line.cp * sign) / 100;
  return (cp > 0 ? '+' : '') + cp.toFixed(2);
}

// Bot difficulty presets.
export const BOT_LEVELS = [
  { id: 1, name: 'Beginner', approx: '~600', strength: { skill: 0 }, depth: 1 },
  { id: 2, name: 'Novice', approx: '~900', strength: { skill: 2 }, depth: 3 },
  { id: 3, name: 'Casual', approx: '~1200', strength: { skill: 5 }, depth: 6 },
  { id: 4, name: 'Club', approx: '1400', strength: { elo: 1400 }, movetime: 500 },
  { id: 5, name: 'Strong Club', approx: '1700', strength: { elo: 1700 }, movetime: 600 },
  { id: 6, name: 'Expert', approx: '2000', strength: { elo: 2000 }, movetime: 800 },
  { id: 7, name: 'Master', approx: '2400', strength: { elo: 2400 }, movetime: 1000 },
  { id: 8, name: 'Stockfish (max)', approx: '3000+', strength: null, movetime: 1500 },
];
