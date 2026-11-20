import { useState } from 'react';
import PlayTab from './tabs/PlayTab';
import CoachTab from './tabs/CoachTab';
import OpeningsTab from './tabs/OpeningsTab';
import SquaresTab from './tabs/SquaresTab';
import StyleTab from './tabs/StyleTab';
import ProgressTab from './tabs/ProgressTab';
import GameReview from './analysis/GameReview';
import WhoIsPlaying from './profile/WhoIsPlaying';
import { loadProfiles, saveProfiles, setCurrentProfileId } from './profile/store';
import { ThemeProvider } from './theme/ThemeContext';

const TABS = [
  { id: 'play', label: '♟ Play vs Bot' },
  { id: 'coach', label: '🧠 Best-Move Coach' },
  { id: 'openings', label: '📖 Openings' },
  { id: 'squares', label: '🎯 Squares' },
  { id: 'progress', label: '📈 My Progress' },
  { id: 'style', label: '🎨 Board Style' },
];

/** Everything for one signed-in player. Remounted when the player changes, so all their saved data loads fresh. */
function PlayerApp({ profile, onSwitch }) {
  const [tab, setTab] = useState('play');
  const [coachStart, setCoachStart] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  function sendToCoach(sans, color, opponent) {
    setCoachStart({ sans, color, opponent, at: Date.now() });
    setReviewId(null);
    setTab('coach');
  }

  return (
    <ThemeProvider>
      <div className="app">
        <header className="top">
          <div className="brand">♞ Chess Trainer</div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <button className="player-chip" style={{ '--pc': profile.color }} onClick={onSwitch} title="Switch player">
            <span className="avatar">{profile.avatar}</span>
            <span>{profile.name}</span>
            <span className="muted small">Switch</span>
          </button>
        </header>
        <main>
          {/* Keep tabs mounted (off-screen, not display:none — the board needs real size) so games survive switching tabs */}
          <div className={tab === 'play' ? 'tab-pane' : 'tab-pane off'}>
            <PlayTab profileId={profile.id} onAnalyze={(s, c) => sendToCoach(s, c, 'manual')} onReview={setReviewId} />
          </div>
          <div className={tab === 'coach' ? 'tab-pane' : 'tab-pane off'}><CoachTab start={coachStart} active={tab === 'coach'} /></div>
          <div className={tab === 'openings' ? 'tab-pane' : 'tab-pane off'}><OpeningsTab active={tab === 'openings'} onContinueInCoach={(s, c) => sendToCoach(s, c, 'engine')} /></div>
          <div className={tab === 'squares' ? 'tab-pane' : 'tab-pane off'}><SquaresTab active={tab === 'squares'} /></div>
          {tab === 'progress' && <ProgressTab profile={profile} active onReview={setReviewId} />}
          {tab === 'style' && <StyleTab />}
        </main>
        {reviewId && (
          <GameReview profileId={profile.id} gameId={reviewId} onClose={() => setReviewId(null)} onExplore={(s, c) => sendToCoach(s, c, 'manual')} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  const [profileId, setProfileId] = useState(null); // always ask "Who's playing?" when the app opens
  const profile = profileId ? loadProfiles().list.find((p) => p.id === profileId) : null;

  if (!profile) {
    setCurrentProfileId(null);
    return (
      <WhoIsPlaying
        onPick={(id) => {
          const p = loadProfiles();
          saveProfiles({ ...p, last: id });
          setProfileId(id);
        }}
      />
    );
  }
  setCurrentProfileId(profile.id); // set before children render so their storage reads use this player's keys
  return <PlayerApp key={profile.id} profile={profile} onSwitch={() => setProfileId(null)} />;
}
