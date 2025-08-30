import React from 'react';

const GameBoard = ({ board, onColumnClick, disabled }) => {
  const handleColumnClick = (colIndex) => {
    if (!disabled) {
      onColumnClick(colIndex);
    }
  };

  return (
    <div className="bg-blue-700 p-4 rounded-lg shadow-2xl mt-4">
      <div className="grid grid-cols-7 gap-2">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => handleColumnClick(colIndex)}
            >
              <div
                className={`w-14 h-14 rounded-full transition-colors duration-300
                  ${cell === 1 ? 'bg-red-500' : ''}
                  ${cell === 2 ? 'bg-yellow-400' : ''}
                  ${cell === 0 ? 'bg-gray-800' : ''}
                `}
              ></div>
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
