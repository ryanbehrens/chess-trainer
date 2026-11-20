import { useState } from 'react';
import PlayTab from './tabs/PlayTab';
import CoachTab from './tabs/CoachTab';
import OpeningsTab from './tabs/OpeningsTab';
import SquaresTab from './tabs/SquaresTab';
import StyleTab from './tabs/StyleTab';
import { ThemeProvider } from './theme/ThemeContext';

const TABS = [
  { id: 'play', label: '♟ Play vs Bot' },
  { id: 'coach', label: '🧠 Best-Move Coach' },
  { id: 'openings', label: '📖 Openings' },
  { id: 'squares', label: '🎯 Squares' },
  { id: 'style', label: '🎨 Board Style' },
];

export default function App() {
  const [tab, setTab] = useState('coach');
  const [coachStart, setCoachStart] = useState(null);

  function sendToCoach(sans, color, opponent) {
    setCoachStart({ sans, color, opponent, at: Date.now() });
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
      </header>
      <main>
        {/* Keep tabs mounted (off-screen, not display:none — the board needs real size) so games survive switching tabs */}
        <div className={tab === 'play' ? 'tab-pane' : 'tab-pane off'}><PlayTab onAnalyze={(s, c) => sendToCoach(s, c, 'manual')} /></div>
        <div className={tab === 'coach' ? 'tab-pane' : 'tab-pane off'}><CoachTab start={coachStart} active={tab === 'coach'} /></div>
        <div className={tab === 'openings' ? 'tab-pane' : 'tab-pane off'}><OpeningsTab active={tab === 'openings'} onContinueInCoach={(s, c) => sendToCoach(s, c, 'engine')} /></div>
        <div className={tab === 'squares' ? 'tab-pane' : 'tab-pane off'}><SquaresTab active={tab === 'squares'} /></div>
        {tab === 'style' && <StyleTab />}
      </main>
    </div>
    </ThemeProvider>
  );
}
