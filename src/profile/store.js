// Player profiles. There's no password: each profile is a separate save slot on this device/browser,
// so a parent and a child can each have their own settings, progress and game history.

const PROFILES_KEY = 'chess-trainer-profiles-v1';
const GAMES_KEY = 'chess-trainer-games-v1';
const MAX_GAMES = 400;

// Per-player keys. Data saved before profiles existed is handed to the first profile created.
export const PROFILE_KEYS = [
  'chess-trainer-progress-v1',
  'chess-trainer-bot-level',
  'chess-trainer-time-control',
  'chess-trainer-squares-v1',
  'chess-trainer-board-style-v1',
];

export const AVATARS = ['🦁', '🐯', '🦊', '🐻', '🐼', '🐸', '🦄', '🐲', '🦈', '🦅', '🐙', '🚀', '⚽', '🏀', '🎮', '👑', '🧙', '🥷', '🤖', '👽', '🎸', '🌟', '🔥', '♞'];
export const PROFILE_COLORS = ['#5b9dff', '#3fbf6f', '#e5b93a', '#f97316', '#e5534b', '#c084fc', '#22d3ee', '#f472b6'];

let currentId = null;
/** The storage key for the current player. */
export const pkey = (base) => (currentId ? `${base}@${currentId}` : base);
export const setCurrentProfileId = (id) => {
  currentId = id;
};
export const getCurrentProfileId = () => currentId;

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

export function loadProfiles() {
  return read(PROFILES_KEY, { list: [], last: null });
}
export function saveProfiles(p) {
  write(PROFILES_KEY, p);
}

export function createProfile({ name, avatar, color }) {
  const p = loadProfiles();
  const profile = { id: Math.random().toString(36).slice(2, 10), name: name.trim(), avatar, color, created: Date.now() };
  if (p.list.length === 0) {
    // The first player inherits everything saved before profiles existed.
    for (const k of PROFILE_KEYS) {
      try {
        const v = localStorage.getItem(k);
        if (v != null && localStorage.getItem(`${k}@${profile.id}`) == null) localStorage.setItem(`${k}@${profile.id}`, v);
      } catch {
        /* ignore */
      }
    }
  }
  p.list.push(profile);
  saveProfiles(p);
  return profile;
}

export function updateProfile(id, patch) {
  const p = loadProfiles();
  p.list = p.list.map((x) => (x.id === id ? { ...x, ...patch } : x));
  saveProfiles(p);
}

export function deleteProfile(id) {
  const p = loadProfiles();
  p.list = p.list.filter((x) => x.id !== id);
  if (p.last === id) p.last = null;
  saveProfiles(p);
  try {
    for (const k of [...PROFILE_KEYS, GAMES_KEY]) localStorage.removeItem(`${k}@${id}`);
  } catch {
    /* ignore */
  }
}

// ── Game history (per profile) ──
export function loadGames(profileId = currentId) {
  return read(`${GAMES_KEY}@${profileId}`, []);
}
export function saveGame(record) {
  const games = loadGames(record.profileId).filter((g) => g.id !== record.id);
  games.push(record);
  games.sort((a, b) => a.date - b.date);
  write(`${GAMES_KEY}@${record.profileId}`, games.slice(-MAX_GAMES));
  window.dispatchEvent(new CustomEvent('games-changed', { detail: record.profileId }));
}
export function updateGame(profileId, id, patch) {
  const games = loadGames(profileId);
  const g = games.find((x) => x.id === id);
  if (!g) return;
  saveGame({ ...g, ...patch });
}
export function deleteGame(profileId, id) {
  write(`${GAMES_KEY}@${profileId}`, loadGames(profileId).filter((g) => g.id !== id));
  window.dispatchEvent(new CustomEvent('games-changed', { detail: profileId }));
}
