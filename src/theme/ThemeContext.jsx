import { pkey } from '../profile/store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Chessboard, defaultBoardStyle, defaultPieces } from 'react-chessboard';
import { DEFAULT_SETTINGS, PIECE_FX, resolveTheme } from './themes';

const STORE_KEY = 'chess-trainer-board-style-v1';
const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(pkey(STORE_KEY))) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(pkey(STORE_KEY), JSON.stringify(settings));
    } catch {
      /* storage unavailable — style just won't persist */
    }
  }, [settings]);
  const value = useMemo(() => ({ settings, update: (patch) => setSettings((s) => ({ ...s, ...patch })) }), [settings]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useBoardSettings() {
  return useContext(ThemeCtx);
}

/** The board-option props a theme contributes (square colors, coordinates, frame, pieces). */
export function useThemeOptions(overrides = {}) {
  const { settings } = useBoardSettings();
  const s = { ...settings, ...overrides };
  const theme = resolveTheme(s);
  const fxName = s.pieceFx === 'auto' ? theme.pieceFx ?? 'none' : s.pieceFx;

  const pieces = useMemo(() => {
    const fx = PIECE_FX[fxName] ?? PIECE_FX.none;
    if (!fx.w && !fx.b) return defaultPieces;
    return Object.fromEntries(
      Object.entries(defaultPieces).map(([k, render]) => [k, (props) => render({ ...props, svgStyle: { ...props?.svgStyle, ...fx[k[0]] } })]),
    );
  }, [fxName]);

  return useMemo(
    () => ({
      theme,
      options: {
        lightSquareStyle: theme.light,
        darkSquareStyle: theme.dark,
        lightSquareNotationStyle: { color: theme.notation[0], fontWeight: 600 },
        darkSquareNotationStyle: { color: theme.notation[1], fontWeight: 600 },
        showNotation: s.coords,
        boardStyle: { ...defaultBoardStyle(8), borderRadius: theme.frame?.borderRadius ?? 4 },
        pieces,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, s.coords, pieces],
  );
}

/** Animated layer drawn underneath see-through themes. */
export function BoardFx({ fx }) {
  if (!fx) return null;
  if (fx === 'water') {
    return (
      <div className="board-fx fx-water">
        <svg className="caustics a" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden>
          <filter id="caustic-a">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 0.75  0 0 0 0 0.95  0 0 0 0 1  0 0 0 9 -4.4" />
          </filter>
          <rect width="400" height="400" filter="url(#caustic-a)" />
        </svg>
        <svg className="caustics b" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden>
          <filter id="caustic-b">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.016" numOctaves="2" seed="11" />
            <feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.9  0 0 0 0 1  0 0 0 8 -4.2" />
          </filter>
          <rect width="400" height="400" filter="url(#caustic-b)" />
        </svg>
      </div>
    );
  }
  return <div className={`board-fx fx-${fx}`} />;
}

/** A react-chessboard with the current theme applied. */
export function ThemedBoard({ options, themeOverrides, overlay, className = '' }) {
  const { theme, options: themed } = useThemeOptions(themeOverrides);
  const radius = theme.frame?.borderRadius ?? 4;
  return (
    <div className={`board-wrap ${className}`} style={{ boxShadow: theme.frame?.boxShadow, borderRadius: radius }}>
      <BoardFx fx={theme.fx} />
      <div className="board-inner">
        <Chessboard options={{ ...themed, ...options, boardStyle: { ...themed.boardStyle, ...options.boardStyle } }} />
        {overlay && <div className="board-overlay">{overlay}</div>}
      </div>
    </div>
  );
}
