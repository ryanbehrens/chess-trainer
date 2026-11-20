// Opening book. Every line is a space-separated list of SAN moves from the starting position.
// `side` is the side you'd normally learn the opening as (you can drill either side in the app).
// Run `npm run test:openings` after editing to check every line is legal.

export const OPENINGS = [
  // ───────────────────────────── 1.e4 openings for White ─────────────────────────────
  {
    id: 'italian',
    name: 'Italian Game',
    eco: 'C50–C54',
    side: 'white',
    summary:
      'Develop fast, aim the bishop at f7, and build a slow center with c3 and d3/d4. Great first opening: natural moves, clear plans.',
    lines: [
      {
        name: 'Giuoco Pianissimo (slow main line)',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 a4 Ba7 h3 h6 Nbd2 Re8 Nf1 Be6',
        idea: 'Quiet build-up: Re1, h3, then the knight reroutes Nbd2–f1–g3 toward the kingside. Avoid early tactics, outmaneuver slowly.',
      },
      {
        name: 'Giuoco Piano: c3 + d4',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 exd5 Nxd5 Qb3 Nce7 O-O O-O Rfe1 c6',
        idea: 'White grabs the full center with c3 and d4. Black strikes back with ...d5. White gets an isolated d-pawn but active pieces.',
      },
      {
        name: 'Two Knights: quiet d3',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3 Na5 Bb5 a6 Ba4 b5 Bc2 c5 Nbd2 Re8',
        idea: 'Against 3...Nf6, d3 keeps e4 protected. The game becomes Ruy Lopez-like with the bishop retreating to c2.',
      },
      {
        name: 'Two Knights: 4.Ng5 (Fried Liver attempt)',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5 Bd6 d4 exd3 Nxd3 Qc7',
        idea: '4.Ng5 attacks f7. Black must NOT play 5...Nxd5 (Fried Liver). After 5...Na5 Black gives a pawn for fast development.',
      },
      {
        name: 'Evans Gambit',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5 Ba3 Be6',
        idea: 'White sacrifices the b-pawn to build a big center with c3 and d4 with tempo on the bishop. Very aggressive.',
      },
    ],
  },
  {
    id: 'ruy',
    name: 'Ruy Lopez (Spanish)',
    eco: 'C60–C99',
    side: 'white',
    summary:
      'Pressure the e5 pawn indirectly by hitting its defender on c6. The deepest classical opening — long-term pressure rather than quick attacks.',
    lines: [
      {
        name: 'Closed: Chigorin',
        moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7 Nbd2 cxd4 cxd4 Nc6',
        idea: 'The classic "Spanish torture": h3 stops ...Bg4, d4 grabs the center, and the knight goes Nbd2–f1–g3. Black counterattacks on the queenside.',
      },
      {
        name: 'Closed: Breyer',
        moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7 Nbd2 Bb7 Bc2 Re8 Nf1 Bf8 Ng3 g6',
        idea: 'Black retreats the knight to b8 to reroute it to d7, keeping c-pawn free. Solid and very respected at top level.',
      },
      {
        name: 'Marshall Attack',
        moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5 Nxe5 Nxe5 Rxe5 c6 d4 Bd6 Re1 Qh4 g3 Qh3 Be3 Bg4 Qd3 Rae8 Nd2',
        idea: 'Black gives a pawn for a fierce kingside attack. White must know the defensive moves g3, Be3, Qd3 and Nd2.',
      },
      {
        name: 'Berlin Defense',
        moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8 Nc3 Ke8 h3 h5',
        idea: 'The "Berlin Wall": queens come off early. Black has the bishop pair; White has a kingside pawn majority.',
      },
      {
        name: 'Exchange Variation',
        moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4 exd4 Nxd4 c5 Nb3 Qxd1 Rxd1 Bg4 f3 Be6 Nc3 Bd6',
        idea: 'White gives up the bishop to damage Black\'s pawns. In the endgame White\'s healthy kingside majority can make a passed pawn.',
      },
    ],
  },
  {
    id: 'scotch',
    name: 'Scotch Game',
    eco: 'C44–C45',
    side: 'white',
    summary: 'Open the center immediately with 3.d4. Fewer theory traps than the Ruy, clear piece play.',
    lines: [
      {
        name: 'Mieses Variation',
        moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3 g6 g3 Bg7 Bb2 O-O Bg2 Rae8 O-O',
        idea: 'White pushes e5 to kick the knight and gains space. Black hits the e5 pawn with Qe7, ...g6 and ...Bg7.',
      },
      {
        name: 'Classical: 4...Bc5 5.Nb3',
        moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Nb3 Bb6 a4 a6 Nc3 d6 Nd5 Ba7 Be2 Nf6 O-O h6 Nd2 O-O',
        idea: 'White gains time on the bishop and plays a4–a5 ideas to trap or restrict it.',
      },
    ],
  },
  {
    id: 'vienna',
    name: 'Vienna Game',
    eco: 'C25–C29',
    side: 'white',
    summary: 'Nc3 then f4 — a King\'s Gambit idea with more preparation. Sharp and fun.',
    lines: [
      {
        name: 'Vienna Gambit',
        moves: 'e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4 O-O Bd3 f5 exf6 Bxf6 O-O Nc6',
        idea: 'White opens the f-file. Black counters in the center with ...d5 and sets the knight on e4.',
      },
      {
        name: 'Vienna: 2...Nc6 3.Bc4',
        moves: 'e4 e5 Nc3 Nc6 Bc4 Nf6 d3 Bb4 Nf3 d5 exd5 Nxd5 Bd2 Nxc3 bxc3 Be7 Qe2 Qd6 O-O Be6 Bb3 Bxb3 axb3 O-O',
        idea: 'A calm Italian-style setup. Black keeps the bishop on e7 and trades off White\'s strong c4 bishop with ...Be6.',
      },
    ],
  },
  {
    id: 'kings-gambit',
    name: "King's Gambit",
    eco: 'C30–C39',
    side: 'white',
    summary: 'The romantic 2.f4 — sacrifice a pawn to open the f-file and attack. Risky, very instructive for attacking play.',
    lines: [
      {
        name: 'Accepted: Modern (3...d5)',
        moves: 'e4 e5 f4 exf4 Nf3 d5 exd5 Nf6 Bb5+ c6 dxc6 Nxc6 d4 Bd6 Qe2+ Be6 Ng5 O-O Nxe6 fxe6',
        idea: 'Black returns the pawn for fast development. A sane, healthy way to meet the gambit.',
      },
      {
        name: 'Accepted: Kieseritzky',
        moves: 'e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6 Bc4 d5 exd5 Bd6 d4 Nh5 O-O Qxh4',
        idea: 'Black tries to keep the pawn with ...g5. White undermines immediately with h4 and Ne5.',
      },
      {
        name: 'Declined: Falkbeer',
        moves: 'e4 e5 f4 d5 exd5 exf4 Nf3 Nf6 c4 c6 d4 Bb4+ Nc3 cxd5 Bxf4 O-O',
        idea: 'Black counter-strikes with ...d5 instead of taking. Often transposes to a rich open game.',
      },
    ],
  },
  {
    id: 'smith-morra',
    name: 'Smith-Morra Gambit',
    eco: 'B21',
    side: 'white',
    summary: 'Anti-Sicilian: give a pawn for rapid development and open c- and d-files. Dangerous at club level.',
    lines: [
      {
        name: 'Accepted: Classical setup',
        moves: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1 e5 Be3 O-O',
        idea: 'White puts rooks on c1/d1, bishop on c4 eyeing e6/f7, and looks for Nd5 or e5 breakthroughs.',
      },
      {
        name: 'Accepted: ...a6 / ...Nge7',
        moves: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 a6 O-O Nge7 Bg5 f6 Be3 Ng6 Qe2',
        idea: 'Black prevents Nb5 and develops the knight to e7–g6. White keeps the initiative with quick development.',
      },
    ],
  },

  // ───────────────────────────── 1.d4 / 1.c4 openings for White ─────────────────────────────
  {
    id: 'qgd',
    name: "Queen's Gambit",
    eco: 'D06–D69',
    side: 'white',
    summary:
      "Offer the c-pawn to deflect Black's d5 pawn and win central control. The backbone of 1.d4 play.",
    lines: [
      {
        name: 'Declined: Orthodox / Tartakower',
        moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 cxd5 Nxd5 Bxe7 Qxe7 Nxd5 exd5 Rc1 Be6',
        idea: 'Classic QGD: White pins the knight with Bg5. Black fianchettoes on the queenside to solve the light-squared bishop problem.',
      },
      {
        name: 'Declined: Exchange (Carlsbad structure)',
        moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 Qc2 Be7 e3 Nbd7 Bd3 O-O Nge2 Re8 O-O Nf8 f3',
        idea: 'White fixes the pawn structure and plans either a minority attack (b4–b5) or a central push with f3 and e4.',
      },
      {
        name: 'Accepted (QGA)',
        moves: 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 dxc5 Qxd1 Rxd1 Bxc5 Kf1 b5 Be2 Bb7',
        idea: 'Black takes the pawn but lets White win it back. Black aims for free development and queenside expansion.',
      },
      {
        name: "Declined: Ragozin",
        moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Bb4 cxd5 exd5 Bg5 Nbd7 e3 c5 Bd3 c4 Bc2 Qa5 O-O O-O',
        idea: 'A Nimzo-style QGD: Black pins the c3 knight and fights for e4.',
      },
    ],
  },
  {
    id: 'london',
    name: 'London System',
    eco: 'D02 / A46',
    side: 'white',
    summary:
      'A system opening: d4, Bf4, e3, Nf3, c3, Nbd2, Bd3. Same setup against almost anything — low theory, solid, and good attacking chances with Ne5.',
    lines: [
      {
        name: 'vs ...d5 / ...c5 (main)',
        moves: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6 Ne5 Bb7 f4 Ne7',
        idea: 'Build the pyramid (c3–d4–e3), meet ...Bd6 with Bg3, then Ne5 and f4 for a kingside attack.',
      },
      {
        name: 'vs King\'s Indian setup',
        moves: 'd4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 c5 c3 b6 O-O Bb7 Nbd2 Nbd7 a4 a6',
        idea: 'h3 gives the bishop a retreat square on h2. White stays compact and plays for a4–a5 or e4 later.',
      },
      {
        name: 'vs early ...Qb6',
        moves: 'd4 d5 Bf4 c5 e3 Nc6 c3 Qb6 Qb3 c4 Qc2 Nf6 Nd2 Bg4 f3 Bd7 e4 e6 Ne2',
        idea: 'Black hits b2. White defends with Qb3 and later breaks with e4 once Black closes the queenside with ...c4.',
      },
    ],
  },
  {
    id: 'catalan',
    name: 'Catalan Opening',
    eco: 'E01–E09',
    side: 'white',
    summary: 'Queen\'s Gambit + kingside fianchetto. The g2 bishop pressures the long diagonal and the queenside for the whole game.',
    lines: [
      {
        name: 'Open Catalan: 5...dxc4',
        moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1',
        idea: 'Black grabs the c4 pawn; White wins it back and plays against Black\'s weakened queenside.',
      },
      {
        name: 'Closed Catalan',
        moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2 b6 e4 Bb7 b3 Rc8',
        idea: 'Black keeps the center closed. White aims for e4 to open lines for the g2 bishop.',
      },
    ],
  },
  {
    id: 'english',
    name: 'English Opening',
    eco: 'A10–A39',
    side: 'white',
    summary: '1.c4 — a reversed Sicilian. Flexible flank control, slow maneuvering games.',
    lines: [
      {
        name: 'Four Knights: reversed Dragon',
        moves: 'c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5 Bg2 Nb6 O-O Be7 d3 O-O a3 Be6 b4',
        idea: 'White plays a Sicilian Dragon with an extra tempo. Expand on the queenside with a3 and b4.',
      },
      {
        name: 'Symmetrical',
        moves: 'c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 Nf3 Nf6 O-O O-O d4 cxd4 Nxd4 Nxd4 Qxd4 d6 Qd3',
        idea: 'Both sides fianchetto. White opens the center with d4 to use the extra tempo.',
      },
    ],
  },

  // ───────────────────────────── Black vs 1.e4 ─────────────────────────────
  {
    id: 'najdorf',
    name: 'Sicilian Najdorf',
    eco: 'B90–B99',
    side: 'black',
    summary:
      'The most popular fighting reply to 1.e4. 5...a6 controls b5 and prepares ...e5 or ...e6 and ...b5. Sharp, rich, double-edged.',
    lines: [
      {
        name: 'English Attack (6.Be3)',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4 b5 g5 b4',
        idea: 'Opposite-side castling race: White storms with g4–g5, Black with ...b5–b4. Speed matters more than material.',
      },
      {
        name: '6.Bg5 Main line',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7 g4 b5 Bxf6 Nxf6 g5 Nd7 f5 Nc5',
        idea: 'The most violent line. White pushes f4–f5 and g4–g5; Black counterattacks with ...b5 and ...Nc5.',
      },
      {
        name: '6.Be2 Classical',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O Be3 Be6 Qd2 Nbd7 a4 Qc7',
        idea: 'Positional play: Black controls d5 with ...e5 and ...Be6. The d5 square is the key battleground.',
      },
      {
        name: '6.h3 / Adams Attack',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 h3 e5 Nde2 h5 g3 Be6 Bg2 b5 Nd5 Nbd7',
        idea: 'White prepares g4 to kick the f6 knight. Black stops it with ...h5.',
      },
    ],
  },
  {
    id: 'dragon',
    name: 'Sicilian Dragon',
    eco: 'B70–B79',
    side: 'black',
    summary: 'Fianchetto the bishop on g7 to breathe fire down the long diagonal. Very sharp vs the Yugoslav Attack.',
    lines: [
      {
        name: 'Yugoslav Attack: 9.Bc4',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5 Kb1 Nc4 Bxc4 Rxc4',
        idea: 'Black uses the c-file and sometimes sacrifices the exchange on c3. White goes h4–h5 to open the h-file.',
      },
      {
        name: 'Yugoslav: 9.O-O-O',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 O-O-O d5 exd5 Nxd5 Nxc6 bxc6 Bd4 Bxd4 Qxd4 Qb6',
        idea: 'Black breaks with an immediate ...d5, sacrificing structure for activity on the b-file.',
      },
      {
        name: 'Classical: 6.Be2',
        moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be2 Bg7 O-O O-O Be3 Nc6 Nb3 Be6 f4 Na5 f5 Bc4',
        idea: 'Calmer: White castles short. Black uses ...Na5 and ...Bc4 to trade White\'s good pieces.',
      },
    ],
  },
  {
    id: 'sveshnikov',
    name: 'Sicilian Sveshnikov',
    eco: 'B33',
    side: 'black',
    summary: 'Black accepts a hole on d5 for active pieces and the bishop pair. Forcing, concrete theory.',
    lines: [
      {
        name: 'Main line: 9.Bxf6',
        moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5 Bd3 Be6 O-O Bxd5 exd5 Ne7',
        idea: 'Black gives up structure for the bishop pair and the ...f5 break against White\'s center.',
      },
      {
        name: '9.Nd5',
        moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Nd5 Be7 Bxf6 Bxf6 c3 O-O Nc2 Bg5',
        idea: 'White keeps a knight on d5. Black\'s dark-squared bishop becomes a strong piece on g5.',
      },
    ],
  },
  {
    id: 'anti-sicilian',
    name: 'Sicilian vs Alapin & Rossolimo',
    eco: 'B22 / B31',
    side: 'black',
    summary: 'Must-know answers when White avoids the Open Sicilian with 2.c3 or 2...Nc6 3.Bb5.',
    lines: [
      {
        name: 'Alapin: 2...d5',
        moves: 'e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 Bg4 Be2 e6 O-O Nc6 Be3 cxd4 cxd4 Be7 Nc3 Qd6',
        idea: 'Black uses the fact that c3 takes away Nc3 to bring the queen out early with no tempo loss.',
      },
      {
        name: 'Alapin: 2...Nf6',
        moves: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5 dxe5 Nxe5 Bd7 Nxd7 Qxd7',
        idea: 'Black attacks e4 immediately and hits the center once White commits to e5.',
      },
      {
        name: 'Rossolimo: 3.Bb5 g6',
        moves: 'e4 c5 Nf3 Nc6 Bb5 g6 O-O Bg7 Re1 e5 Bxc6 dxc6 d3 Qe7 Nbd2 Nf6 Nc4 Nd7 a4 O-O',
        idea: 'Black accepts doubled c-pawns for the bishop pair and solid control of d4.',
      },
    ],
  },
  {
    id: 'caro-kann',
    name: 'Caro-Kann Defense',
    eco: 'B10–B19',
    side: 'black',
    summary:
      '1...c6 prepares ...d5 while keeping the light-squared bishop free. Rock-solid with a healthy pawn structure.',
    lines: [
      {
        name: 'Classical: 4...Bf5',
        moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Ngf6 O-O-O Be7',
        idea: 'Black develops the bishop outside the pawn chain before ...e6. White grabs kingside space with h4–h5.',
      },
      {
        name: 'Advance: Short Variation',
        moves: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 cxd4 Nxd4 Ne7 c4 Nbc6 Qa4 dxc4 Nxc6 Nxc6',
        idea: 'Black hits the d4 base of White\'s chain with ...c5. White plays for development and the e5 space edge.',
      },
      {
        name: 'Exchange Variation',
        moves: 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6 Bxd6 Qxd6 O-O O-O',
        idea: 'Symmetrical structure. Black plays the minority attack ...b5–b4 later; White aims at the kingside.',
      },
      {
        name: 'Panov Attack',
        moves: 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 Nc6 Nf3 Bg4 cxd5 Nxd5 Qb3 Bxf3 gxf3 e6 Qxb7 Nxd4 Bb5+ Nxb5 Qc6+ Ke7 Qxb5 Qd7',
        idea: 'White gets an isolated queen\'s pawn and attacking chances. This forcing line should be known by heart.',
      },
      {
        name: 'Two Knights',
        moves: 'e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6 d4 Nf6 Bd3 dxe4 Nxe4 Qxd4 c3 Qd8 Bd2 Nbd7',
        idea: 'White gets the bishop pair; Black grabs a central pawn but must be careful about development.',
      },
    ],
  },
  {
    id: 'french',
    name: 'French Defense',
    eco: 'C00–C19',
    side: 'black',
    summary:
      '1...e6 and 2...d5. Black concedes space but builds a solid chain and counterattacks with ...c5 and ...f6.',
    lines: [
      {
        name: 'Winawer: Poisoned Pawn',
        moves: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4 Ne2 Nbc6 f4 dxc3',
        idea: 'Black gives up the kingside pawns for a strong center and queenside play. Extremely sharp.',
      },
      {
        name: 'Advance Variation',
        moves: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2 Na5 Rb1 Bd7 Be2 Ne7 O-O Nf5',
        idea: 'Attack the base of the chain (d4) with ...c5, ...Nc6 and ...Qb6. Then ...c4 grabs queenside space.',
      },
      {
        name: 'Tarrasch: 3...Nf6',
        moves: 'e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7 Bd3 c5 c3 Nc6 Ne2 cxd4 cxd4 f6 exf6 Nxf6 O-O Bd6 Nf3 Qc7',
        idea: 'Black breaks with ...c5 and ...f6, gets free piece play in exchange for a weak e6 pawn.',
      },
      {
        name: 'Classical: 4.Bg5',
        moves: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5 Qd2 Nc6 O-O-O c4',
        idea: 'Typical French: White has space on the kingside, Black plays ...c5 and ...c4 on the queenside.',
      },
      {
        name: 'Exchange Variation',
        moves: 'e4 e6 d4 d5 exd5 exd5 Nf3 Nf6 Bd3 Bd6 O-O O-O Bg5 Bg4 Nbd2 Nbd7 c3 c6 Qc2 Qc7',
        idea: 'Symmetrical and calm. Black\'s light-squared bishop is no longer a problem.',
      },
    ],
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian Defense',
    eco: 'B01',
    side: 'black',
    summary: '1...d5 confronts e4 at once. Easy to learn, clear development plan.',
    lines: [
      {
        name: '3...Qa5 Main line',
        moves: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6 Qe2 Bb4 O-O-O Nbd7 a3',
        idea: 'The queen sits safely on a5. Black builds a Caro-Kann-style c6/e6 structure with the bishop out on f5.',
      },
      {
        name: '3...Qd6 Modern',
        moves: 'e4 d5 exd5 Qxd5 Nc3 Qd6 d4 Nf6 Nf3 a6 g3 Bg4 Bg2 Nc6 h3 Bxf3 Qxf3 Qxd4 O-O e6 Rd1 Qb6',
        idea: 'The queen on d6 controls e5. After h3, take on f3 and grab the d4 pawn — the point of Black\'s setup.',
      },
      {
        name: '2...Nf6 Portuguese/Modern',
        moves: 'e4 d5 exd5 Nf6 d4 Nxd5 Nf3 g6 c4 Nb6 Nc3 Bg7 h3 O-O Be3 Nc6 Qd2 e5 d5 Ne7',
        idea: 'Black lets White build a center and then attacks it Grünfeld-style.',
      },
    ],
  },
  {
    id: 'petroff',
    name: "Petroff (Russian) Defense",
    eco: 'C42–C43',
    side: 'black',
    summary: 'Mirror White with 2...Nf6. Super solid, a favorite of world champions for drawing with Black.',
    lines: [
      {
        name: 'Classical: 5.d4',
        moves: 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Nc6 O-O Be7 c4 Nb4 Be2 O-O Nc3 Bf5 a3 Nxc3 bxc3 Nc6',
        idea: 'Black keeps the knight on e4 as long as possible and develops naturally.',
      },
      {
        name: '5.Nc3',
        moves: 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 Nc3 Nxc3 dxc3 Be7 Be3 Nc6 Qd2 Be6 O-O-O Qd7',
        idea: 'Opposite castling. White is slightly ahead in development, so Black must be accurate.',
      },
    ],
  },
  {
    id: 'e5-italian-black',
    name: '1...e5 vs Italian (Black)',
    eco: 'C50–C55',
    side: 'black',
    summary: 'How to handle the Italian as Black — the most common thing you\'ll face at club level.',
    lines: [
      {
        name: 'Two Knights: avoid the Fried Liver',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Qf3 Rb8 Bxc6+ Nxc6 Qxc6+ Nd7 d3 Be7',
        idea: 'After 4.Ng5 d5 5.exd5, play 5...Na5! (never 5...Nxd5). Black gets fast development for a pawn.',
      },
      {
        name: 'Giuoco Piano: ...d6 & ...a6',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 a6 O-O d6 a4 Ba7 Re1 O-O h3 h6 Nbd2 Re8 Nf1 Be6',
        idea: 'Mirror White\'s slow buildup. ...a6 lets the bishop retreat to a7 and avoid being traded on c5 by Na4/d4.',
      },
      {
        name: 'Stop the Italian Gambit: 4.d4',
        moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d4 exd4 O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3 Qa5 Nxe4 Be6 Neg5 O-O-O Nxe6 fxe6 Rxe6 Bd6',
        idea: 'The Max Lange / Italian Gambit. Black returns material to finish development and castle long.',
      },
    ],
  },

  // ───────────────────────────── Black vs 1.d4 ─────────────────────────────
  {
    id: 'kid',
    name: "King's Indian Defense",
    eco: 'E60–E99',
    side: 'black',
    summary:
      'Let White take the center, then strike back with ...e5 or ...c5 and launch a kingside pawn storm. Dynamic and aggressive.',
    lines: [
      {
        name: 'Classical: Mar del Plata',
        moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 Bd2 Nf6 f3 f4',
        idea: 'The center locks. White attacks on the queenside (c5), Black storms the kingside with ...f5–f4–g5–g4.',
      },
      {
        name: 'Sämisch: 5.f3',
        moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5 Qd2 f5 O-O-O Nd7 Bd3 Nc5 Bc2 a6',
        idea: 'White builds a huge pawn center and may castle long. Black uses ...Nh5 and ...f5 to fight on the kingside.',
      },
      {
        name: 'Fianchetto Variation',
        moves: 'd4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4 c6 h3 Qb6 Re1 exd4 Nxd4 Re8',
        idea: 'Quieter. Black often trades on d4 and pressures e4 and the c-pawn with ...Qb6 and ...Re8.',
      },
      {
        name: 'Four Pawns Attack',
        moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4 O-O Nf3 c5 d5 e6 Be2 exd5 cxd5 Re8 e5 dxe5 fxe5 Ng4 Bg5 Qb6',
        idea: 'White grabs maximum space. Black must hit back with ...c5 and ...e6 before White\'s center rolls forward.',
      },
    ],
  },
  {
    id: 'nimzo',
    name: 'Nimzo-Indian Defense',
    eco: 'E20–E59',
    side: 'black',
    summary: 'Pin the c3 knight with ...Bb4 to fight for e4. Flexible, sound, played by every world champion.',
    lines: [
      {
        name: 'Classical: 4.Qc2',
        moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 e3 d6 f3 Nbd7 Bd3 c5 Ne2 Rc8',
        idea: 'White keeps a healthy pawn structure; Black takes on c3 and controls the light squares with ...b6 and ...Bb7.',
      },
      {
        name: 'Rubinstein: 4.e3',
        moves: 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6 a3 Bxc3 bxc3 dxc4 Bxc4 Qc7 Bd3 e5',
        idea: 'Central tension. Black gives White the bishop pair but strikes with ...e5 to free the position.',
      },
      {
        name: 'Sämisch: 4.a3',
        moves: 'd4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 f3 d5 cxd5 Nxd5 dxc5 f5 Qd4 O-O c4 Nc6 Qd2 Nf6',
        idea: 'White gets doubled c-pawns plus the bishop pair. Black attacks the weak c4/c3 pawns.',
      },
    ],
  },
  {
    id: 'slav',
    name: 'Slav Defense',
    eco: 'D10–D19',
    side: 'black',
    summary: '2...c6 supports d5 without blocking the c8 bishop. Very solid answer to the Queen\'s Gambit.',
    lines: [
      {
        name: 'Main line: 4...dxc4 5.a4 Bf5',
        moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7 e4 Bg6 Bd3 Bh5',
        idea: 'Black takes the pawn, develops the bishop to f5, then gives it back for smooth development.',
      },
      {
        name: 'Semi-Slav: Meran',
        moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5 d5 Qc7',
        idea: 'Black gains queenside space with ...b5 and breaks with ...c5. Very rich and dynamic.',
      },
      {
        name: 'Exchange Slav',
        moves: 'd4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5 Nf3 e6 Bb5 Nd7 Qa4 Qb6 Nh4 Be4',
        idea: 'Symmetrical. Black just copies White carefully and is fine.',
      },
    ],
  },
  {
    id: 'grunfeld',
    name: 'Grünfeld Defense',
    eco: 'D70–D99',
    side: 'black',
    summary: 'Invite White to build a big center, then attack it with ...c5, ...Bg7 and ...Nc6. Highly theoretical and dynamic.',
    lines: [
      {
        name: 'Exchange: Modern 7.Nf3',
        moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2 cxd4 cxd4 Qa5+ Bd2 Qxa2 O-O Bg4',
        idea: 'Black grabs the a-pawn while White plays for the center and initiative. Sharp and concrete.',
      },
      {
        name: 'Exchange: 7.Bc4',
        moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Bc4 c5 Ne2 Nc6 Be3 O-O O-O b6 Qd2 Bb7',
        idea: 'The classical exchange. Black piles up on d4 with ...c5, ...Nc6 and ...Bg7.',
      },
      {
        name: 'Russian System: 5.Qb3',
        moves: 'd4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7 Qb3 dxc4 Qxc4 O-O e4 a6 Be2 b5 Qb3 c5 dxc5 Bb7',
        idea: 'White wins c4 back with the queen and builds a center. Black counters with ...a6, ...b5 and ...c5.',
      },
    ],
  },
  {
    id: 'qid',
    name: "Queen's Indian Defense",
    eco: 'E12–E19',
    side: 'black',
    summary: 'Control e4 with ...b6 and ...Bb7/Ba6. Solid, positional, pairs well with the Nimzo.',
    lines: [
      {
        name: 'Fianchetto: 4...Ba6',
        moves: 'd4 Nf6 c4 e6 Nf3 b6 g3 Ba6 b3 Bb4+ Bd2 Be7 Bg2 c6 Bc3 d5 Ne5 Nfd7 Nxd7 Nxd7 Nd2 O-O O-O',
        idea: 'Black hits c4 with ...Ba6 to provoke b3, then plays ...c6 and ...d5 for a solid center.',
      },
      {
        name: 'Petrosian: 4.a3',
        moves: 'd4 Nf6 c4 e6 Nf3 b6 a3 Bb7 Nc3 d5 cxd5 Nxd5 Qc2 Nxc3 bxc3 Be7 e4 O-O Bd3 c5 O-O',
        idea: 'a3 stops ...Bb4. White builds a big center; Black undermines it with ...c5.',
      },
    ],
  },
  {
    id: 'dutch',
    name: 'Dutch Defense',
    eco: 'A80–A99',
    side: 'black',
    summary: '1...f5 fights for e4 and aims for a kingside attack. Unbalanced from move one.',
    lines: [
      {
        name: 'Leningrad',
        moves: 'd4 f5 g3 Nf6 Bg2 g6 Nf3 Bg7 O-O O-O c4 d6 Nc3 Qe8 d5 a5 Be3 Na6 Rc1',
        idea: 'A King\'s Indian with ...f5. Black prepares ...e5 with ...Qe8.',
      },
      {
        name: 'Stonewall',
        moves: 'd4 f5 g3 Nf6 Bg2 e6 Nf3 d5 O-O Bd6 c4 c6 b3 Qe7 Ne5 O-O Bb2 Nbd7 Nd2',
        idea: 'Black builds a pawn wall (c6–d5–e6–f5) and puts a knight on e4. The light-squared bishop is the problem piece.',
      },
    ],
  },
];

// Flatten for lookups: give every line a stable id and parsed move list.
export const ALL_LINES = OPENINGS.flatMap((o) =>
  o.lines.map((l, i) => ({
    ...l,
    id: `${o.id}-${i}`,
    openingId: o.id,
    openingName: o.name,
    side: l.side ?? o.side,
    sans: l.moves.trim().split(/\s+/),
  })),
);

/**
 * Identify the opening for a game so far.
 * Returns the deepest matching line and the set of book continuations.
 */
export function lookupBook(history) {
  let best = null;
  const next = new Map(); // san -> [line names]
  for (const line of ALL_LINES) {
    let n = 0;
    while (n < history.length && n < line.sans.length && line.sans[n] === history[n]) n++;
    if (n === history.length && n < line.sans.length) {
      const san = line.sans[n];
      if (!next.has(san)) next.set(san, []);
      next.get(san).push(line);
    }
    if (n > 0 && (!best || n > best.depth)) best = { line, depth: n, openings: new Set() };
    if (best && n === best.depth) best.openings.add(line.openingName);
  }
  if (best) best.openings = [...best.openings];
  const inBook = history.length === 0 || (best && best.depth === history.length);
  return { best, inBook, next: [...next.entries()].map(([san, lines]) => ({ san, lines })) };
}
