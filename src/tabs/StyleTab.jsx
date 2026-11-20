import { THEMES } from '../theme/themes';
import { BoardFx, ThemedBoard, useBoardSettings } from '../theme/ThemeContext';

const PREVIEW_FEN = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5';

const PIECE_FX_OPTIONS = [
  ['auto', "Theme's default"],
  ['none', 'Flat'],
  ['shadow', 'Soft shadow'],
  ['float', 'Floating'],
  ['neon', 'Neon glow'],
  ['ember', 'Ember glow'],
];

function Swatch({ theme, active, onClick }) {
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells.push((r + c) % 2 === 0 ? theme.light : theme.dark);
  return (
    <button className={`swatch ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="swatch-board" style={{ borderRadius: Math.min(theme.frame?.borderRadius ?? 4, 8) }}>
        <BoardFx fx={theme.fx} />
        <div className="swatch-grid">
          {cells.map((st, i) => (
            <div key={i} style={st} />
          ))}
        </div>
      </div>
      <span>{theme.name}</span>
    </button>
  );
}

export default function StyleTab() {
  const { settings, update } = useBoardSettings();
  const groups = ['Classic', 'Effects'];
  const custom = {
    id: 'custom',
    name: 'Custom colors',
    light: { backgroundColor: settings.custom.light },
    dark: { backgroundColor: settings.custom.dark },
  };

  return (
    <div className="layout">
      <div className="board-col">
        <ThemedBoard options={{ id: 'stylepreview', position: PREVIEW_FEN, allowDragging: false, allowDrawingArrows: false }} />
        <div className="muted small center-text">Preview — your choice applies to every board in the app.</div>
      </div>

      <aside className="panel wide">
        {groups.map((g) => (
          <div className="card" key={g}>
            <h3>{g === 'Classic' ? 'Classic looks' : '✨ Special effects'}</h3>
            <div className="swatches">
              {THEMES.filter((t) => t.group === g).map((t) => (
                <Swatch key={t.id} theme={t} active={settings.themeId === t.id} onClick={() => update({ themeId: t.id })} />
              ))}
              {g === 'Classic' && <Swatch theme={custom} active={settings.themeId === 'custom'} onClick={() => update({ themeId: 'custom' })} />}
            </div>
          </div>
        ))}

        <div className="card">
          <h3>Custom colors</h3>
          <div className="color-row">
            <label>
              Light squares
              <input
                type="color"
                value={settings.custom.light}
                onChange={(e) => update({ themeId: 'custom', custom: { ...settings.custom, light: e.target.value } })}
              />
            </label>
            <label>
              Dark squares
              <input
                type="color"
                value={settings.custom.dark}
                onChange={(e) => update({ themeId: 'custom', custom: { ...settings.custom, dark: e.target.value } })}
              />
            </label>
          </div>
        </div>

        <div className="card">
          <h3>Pieces & labels</h3>
          <label className="field">
            Piece effect
            <select value={settings.pieceFx} onChange={(e) => update({ pieceFx: e.target.value })}>
              {PIECE_FX_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={settings.coords} onChange={(e) => update({ coords: e.target.checked })} />
            Show coordinates (a–h, 1–8) on boards
          </label>
        </div>
      </aside>
    </div>
  );
}
