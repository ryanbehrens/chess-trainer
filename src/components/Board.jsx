import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ThemedBoard } from '../theme/ThemeContext';
import { Chess } from 'chess.js';

/**
 * Chessboard with drag-and-drop AND click-to-move, legal-move dots and last-move highlight.
 * onMove({from, to, promotion}) should return true if the move was accepted.
 * movableColor: 'w' | 'b' | 'both' | null (null = board locked)
 *
 * The inner <Chessboard> is memoized on what it actually displays. Parents (like the Coach,
 * which gets engine updates many times a second) can re-render freely without disturbing
 * a piece mid-drag or mid-drop.
 */
export default function Board({
  fen,
  orientation = 'white',
  onMove,
  movableColor = 'both',
  arrows = [],
  lastMove,
  flash, // { square, color } for right/wrong feedback
}) {
  // Each board needs its own id: react-chessboard looks squares up by `#${id}-square-xx`,
  // so boards sharing the default id measure each other's squares and animations land wrong.
  const boardId = 'board' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [selected, setSelected] = useState(null);
  const game = useMemo(() => new Chess(fen), [fen]);
  const turn = game.turn();
  const canMoveNow = movableColor === 'both' || movableColor === turn;

  const targets = useMemo(() => {
    if (!selected) return [];
    return game.moves({ square: selected, verbose: true });
  }, [game, selected]);

  // Latest values for the stable handlers below.
  const live = useRef({});
  live.current = { game, turn, canMoveNow, selected, targets, onMove };

  const tryMove = useCallback((from, to) => {
    const { game: g, onMove: cb } = live.current;
    const legal = g.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!legal) return false;
    const ok = cb?.({ from, to, promotion: legal.promotion ? 'q' : undefined });
    setSelected(null);
    return !!ok;
  }, []);

  const onSquareClick = useCallback(
    ({ square, piece }) => {
      const { canMoveNow: can, selected: sel, targets: tg, turn: t } = live.current;
      if (!can) return;
      if (sel && tg.some((m) => m.to === square)) {
        tryMove(sel, square);
        return;
      }
      if (piece && piece.pieceType[0] === t) setSelected(square === sel ? null : square);
      else setSelected(null);
    },
    [tryMove],
  );

  const canDragPiece = useCallback(
    ({ piece }) => live.current.canMoveNow && piece.pieceType[0] === live.current.turn,
    [],
  );
  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (!targetSquare || !live.current.canMoveNow) return false;
      return tryMove(sourceSquare, targetSquare);
    },
    [tryMove],
  );
  const onPieceDrag = useCallback(({ square }) => setSelected(square), []);

  const squareStyles = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(255, 214, 10, 0.38)' };
    squareStyles[lastMove.to] = { background: 'rgba(255, 214, 10, 0.5)' };
  }
  if (game.inCheck()) {
    const king = game
      .board()
      .flat()
      .find((p) => p && p.type === 'k' && p.color === turn);
    if (king) squareStyles[king.square] = { background: 'radial-gradient(circle, rgba(255,40,40,.85) 0%, rgba(255,40,40,0) 75%)' };
  }
  if (selected) squareStyles[selected] = { background: 'rgba(80, 160, 255, 0.5)' };
  for (const m of targets) {
    squareStyles[m.to] = {
      ...(squareStyles[m.to] || {}),
      backgroundImage: m.captured
        ? 'radial-gradient(circle, transparent 58%, rgba(0,0,0,.28) 60%)'
        : 'radial-gradient(circle, rgba(0,0,0,.25) 22%, transparent 24%)',
    };
  }
  if (flash) squareStyles[flash.square] = { background: flash.color };

  // Compare by value, not identity, so equal-looking props don't re-render the board.
  const stylesKey = JSON.stringify(squareStyles);
  const arrowsKey = JSON.stringify(arrows);

  const board = useMemo(
    () => (
      <ThemedBoard
        options={{
          id: boardId,
          position: fen,
          boardOrientation: orientation,
          arrows: JSON.parse(arrowsKey),
          squareStyles: JSON.parse(stylesKey),
          animationDurationInMs: 180,
          allowDrawingArrows: true,
          clearArrowsOnPositionChange: true,
          canDragPiece,
          onPieceDrop,
          onSquareClick,
          onPieceDrag,
        }}
      />
    ),
    [boardId, fen, orientation, arrowsKey, stylesKey, canDragPiece, onPieceDrop, onSquareClick, onPieceDrag],
  );

  return board;
}
