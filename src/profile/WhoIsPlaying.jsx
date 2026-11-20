import { useState } from 'react';
import { AVATARS, PROFILE_COLORS, createProfile, deleteProfile, loadGames, loadProfiles, updateProfile } from './store';
import { ratingSummary } from './stats';

function ProfileEditor({ initial, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0]);
  const [color, setColor] = useState(initial?.color ?? PROFILE_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ok = name.trim().length > 0;
  return (
    <div className="profile-editor card">
      <h3>{initial ? 'Edit player' : 'New player'}</h3>
      <div className="editor-preview" style={{ '--pc': color }}>
        <span className="avatar big">{avatar}</span>
        <span>{name || 'Your name'}</span>
      </div>
      <label className="field">
        Name
        <input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok && onSave({ name, avatar, color })} placeholder="e.g. Dad, Sam…" />
      </label>
      <div className="pick-label">Picture</div>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button key={a} className={`avatar-pick ${a === avatar ? 'active' : ''}`} onClick={() => setAvatar(a)}>
            {a}
          </button>
        ))}
      </div>
      <div className="pick-label">Color</div>
      <div className="color-dots">
        {PROFILE_COLORS.map((c) => (
          <button key={c} className={`color-dot ${c === color ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
        ))}
      </div>
      <div className="btn-row">
        <button className="btn primary" disabled={!ok} onClick={() => onSave({ name, avatar, color })}>
          {initial ? 'Save' : 'Create player'}
        </button>
        {onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}
        {onDelete &&
          (confirmDelete ? (
            <button className="btn danger" onClick={onDelete}>Delete {initial.name} and all their games?</button>
          ) : (
            <button className="btn ghost-danger" onClick={() => setConfirmDelete(true)}>Delete player</button>
          ))}
      </div>
    </div>
  );
}

export default function WhoIsPlaying({ onPick }) {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [editing, setEditing] = useState(profiles.list.length === 0 ? 'new' : null); // null | 'new' | profile id
  const refresh = () => setProfiles(loadProfiles());

  if (editing) {
    const initial = editing === 'new' ? null : profiles.list.find((p) => p.id === editing);
    return (
      <div className="who-screen">
        <div className="who-title">{profiles.list.length === 0 ? '♞ Welcome! Who’s playing?' : '♞ Chess Trainer'}</div>
        {profiles.list.length === 0 && <div className="muted center-text">Create a player to keep your own games, stats and progress.</div>}
        <ProfileEditor
          initial={initial}
          onCancel={profiles.list.length ? () => setEditing(null) : null}
          onDelete={initial ? () => (deleteProfile(initial.id), refresh(), setEditing(null)) : null}
          onSave={(v) => {
            if (initial) {
              updateProfile(initial.id, { ...v, name: v.name.trim() });
              refresh();
              setEditing(null);
            } else {
              onPick(createProfile(v).id);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="who-screen">
      <div className="who-title">Who’s playing?</div>
      <div className="who-grid">
        {profiles.list.map((p) => {
          const r = ratingSummary(loadGames(p.id));
          return (
            <div key={p.id} className="who-card" style={{ '--pc': p.color }}>
              <button className="who-pick" onClick={() => onPick(p.id)}>
                <span className="avatar huge">{p.avatar}</span>
                <span className="who-name">{p.name}</span>
                <span className="who-sub">
                  {r.games ? `${r.games} game${r.games === 1 ? '' : 's'}` : 'New player'}
                  {r.rating ? ` · ~${r.rating}` : ''}
                </span>
              </button>
              <button className="who-edit" title={`Edit ${p.name}`} onClick={() => setEditing(p.id)}>✎</button>
            </div>
          );
        })}
        <div className="who-card add">
          <button className="who-pick" onClick={() => setEditing('new')}>
            <span className="avatar huge plus">+</span>
            <span className="who-name">Add player</span>
            <span className="who-sub">&nbsp;</span>
          </button>
        </div>
      </div>
      <div className="muted small center-text who-note">Profiles are saved in this browser. Anyone using it can pick any player — there’s no password.</div>
    </div>
  );
}
