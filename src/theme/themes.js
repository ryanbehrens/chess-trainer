// Board themes. Each theme styles the light/dark squares, the coordinate labels, the board frame,
// an optional animated effect layer underneath the squares (fx), and a piece effect (pieceFx).

const grain = (a) => `repeating-linear-gradient(96deg, rgba(60,30,5,${a}) 0 2px, transparent 2px 7px, rgba(60,30,5,${a / 2}) 7px 8px, transparent 8px 13px)`;

export const THEMES = [
  // ── Classic ──
  {
    id: 'classic',
    name: 'Classic Wood',
    group: 'Classic',
    light: { backgroundColor: '#f0d9b5' },
    dark: { backgroundColor: '#b58863' },
    notation: ['#b58863', '#f0d9b5'],
  },
  {
    id: 'tournament',
    name: 'Tournament Green',
    group: 'Classic',
    light: { backgroundColor: '#eeeed2' },
    dark: { backgroundColor: '#769656' },
    notation: ['#769656', '#eeeed2'],
  },
  {
    id: 'ice',
    name: 'Slate Blue',
    group: 'Classic',
    light: { backgroundColor: '#dee3e6' },
    dark: { backgroundColor: '#8ca2ad' },
    notation: ['#788a94', '#dee3e6'],
  },
  {
    id: 'walnut',
    name: 'Walnut & Maple',
    group: 'Classic',
    light: { background: `${grain(0.05)}, linear-gradient(135deg, #f4ddb4, #e2c08c)` },
    dark: { background: `${grain(0.16)}, linear-gradient(135deg, #8a5a30, #5f3a1c)` },
    notation: ['#8a5a30', '#f4ddb4'],
    frame: { boxShadow: '0 0 0 10px #3b2412, 0 0 0 12px #6b4423, 0 12px 30px rgba(0,0,0,.6)' },
    pieceFx: 'shadow',
  },
  {
    id: 'marble',
    name: 'Marble',
    group: 'Classic',
    light: {
      background:
        'repeating-linear-gradient(125deg, rgba(150,150,160,.10) 0 1px, transparent 1px 14px), radial-gradient(circle at 30% 25%, #ffffff, #e7e6e1 70%)',
    },
    dark: {
      background:
        'repeating-linear-gradient(125deg, rgba(255,255,255,.10) 0 1px, transparent 1px 12px), radial-gradient(circle at 30% 25%, #7d828b, #4f535b 75%)',
    },
    notation: ['#6a6e76', '#e7e6e1'],
    frame: { boxShadow: '0 0 0 8px #2f3136, 0 12px 30px rgba(0,0,0,.6)' },
    pieceFx: 'shadow',
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    group: 'Classic',
    light: { backgroundColor: '#e8e0f0' },
    dark: { backgroundColor: '#7b61a3' },
    notation: ['#7b61a3', '#e8e0f0'],
  },
  {
    id: 'coral',
    name: 'Coral Sand',
    group: 'Classic',
    light: { backgroundColor: '#f6e7d8' },
    dark: { backgroundColor: '#d38b6d' },
    notation: ['#c27a5c', '#f6e7d8'],
  },

  // ── Special effects ──
  {
    id: 'glass',
    name: 'Frosted Glass',
    group: 'Effects',
    fx: 'glass',
    light: {
      backgroundColor: 'rgba(255,255,255,.30)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(0,0,0,.08)',
    },
    dark: {
      backgroundColor: 'rgba(255,255,255,.06)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)',
    },
    notation: ['rgba(40,30,80,.7)', 'rgba(255,255,255,.8)'],
    frame: { boxShadow: '0 0 0 1px rgba(255,255,255,.35), 0 20px 50px rgba(80,40,160,.45)', borderRadius: 14 },
    pieceFx: 'shadow',
  },
  {
    id: 'water',
    name: 'Lagoon (water)',
    group: 'Effects',
    fx: 'water',
    light: { backgroundColor: 'rgba(210,245,255,.20)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.10)' },
    dark: { backgroundColor: 'rgba(0,35,70,.32)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' },
    notation: ['rgba(0,40,70,.75)', 'rgba(220,250,255,.85)'],
    frame: { boxShadow: '0 0 0 6px rgba(10,60,80,.9), 0 0 0 8px rgba(120,220,255,.35), 0 20px 50px rgba(0,60,90,.6)', borderRadius: 10 },
    pieceFx: 'float',
  },
  {
    id: 'neon',
    name: 'Neon',
    group: 'Effects',
    fx: 'neon',
    light: { backgroundColor: '#150b33', boxShadow: 'inset 0 0 0 1px rgba(34,211,238,.35), inset 0 0 14px rgba(34,211,238,.12)' },
    dark: { backgroundColor: '#090418', boxShadow: 'inset 0 0 0 1px rgba(236,72,153,.30), inset 0 0 14px rgba(236,72,153,.10)' },
    notation: ['#22d3ee', '#f472b6'],
    frame: { borderRadius: 8 },
    pieceFx: 'neon',
  },
  {
    id: 'lava',
    name: 'Ember',
    group: 'Effects',
    fx: 'ember',
    light: { backgroundColor: 'rgba(40,20,15,.55)', boxShadow: 'inset 0 0 0 1px rgba(255,140,60,.18)' },
    dark: { backgroundColor: 'rgba(10,5,5,.72)', boxShadow: 'inset 0 0 0 1px rgba(255,90,30,.12)' },
    notation: ['#ffb37a', '#ff7a3d'],
    frame: { borderRadius: 8, boxShadow: '0 0 30px rgba(255,90,30,.35)' },
    pieceFx: 'ember',
  },
];

export const PIECE_FX = {
  none: { w: undefined, b: undefined },
  shadow: { w: { filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.35))' }, b: { filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.35))' } },
  float: { w: { filter: 'drop-shadow(0 8px 5px rgba(0,20,40,.55))' }, b: { filter: 'drop-shadow(0 8px 5px rgba(0,20,40,.55))' } },
  neon: {
    w: { filter: 'drop-shadow(0 0 2px #67e8f9) drop-shadow(0 0 7px rgba(34,211,238,.8))' },
    b: { filter: 'drop-shadow(0 0 2px #f9a8d4) drop-shadow(0 0 7px rgba(236,72,153,.9))' },
  },
  ember: {
    w: { filter: 'drop-shadow(0 0 4px rgba(255,170,90,.8))' },
    b: { filter: 'drop-shadow(0 0 3px rgba(255,90,30,.95)) drop-shadow(0 0 1px #ff9a5a)' },
  },
};

export const DEFAULT_SETTINGS = {
  themeId: 'classic',
  custom: { light: '#f0d9b5', dark: '#b58863' },
  coords: true,
  pieceFx: 'auto', // 'auto' uses the theme's own effect
};

export function resolveTheme(settings) {
  if (settings.themeId === 'custom') {
    const { light, dark } = settings.custom;
    return {
      id: 'custom',
      name: 'Custom',
      light: { backgroundColor: light },
      dark: { backgroundColor: dark },
      notation: [dark, light],
    };
  }
  return THEMES.find((t) => t.id === settings.themeId) ?? THEMES[0];
}
