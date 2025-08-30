import React from 'react';
import GameBoard from './GameBoard';

const GameScreen = ({ gameState, playerNum, roomId, gameMode, isMyTurn, onMakeMove, onGoToMenu }) => {
  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      {roomId && gameMode === 'multiplayer' && (
        <div className="mb-4 p-3 bg-gray-700 rounded text-center">
          Share this Room ID:
          <div
            className="my-2 p-2 bg-gray-800 rounded text-yellow-400 text-2xl font-mono tracking-widest cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => navigator.clipboard.writeText(roomId)}
          >
            {roomId}
          </div>
          <span className="text-sm text-gray-400">Click the code above to copy</span>
        </div>
      )}
      <div className="flex items-center mb-2">
        <span className="mr-2">You are Player {playerNum}</span>
        <div className={`w-6 h-6 rounded-full ${playerNum === 1 ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
      </div>
      <GameBoard board={gameState.board} onColumnClick={onMakeMove} disabled={!isMyTurn} />
      <button className="text-gray-400 hover:text-white mt-8" onClick={onGoToMenu}>
        &larr; Leave Game & Go to Menu
      </button>
    </div>
  );
};

export default GameScreen;