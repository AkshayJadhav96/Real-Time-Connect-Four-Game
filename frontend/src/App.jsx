import React, { useState, useRef, useEffect } from 'react';

// --- Configuration ---
const WEBSOCKET_URL = "ws://localhost:8000/ws";

// --- Helper Components ---

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

// --- Main App Component ---

function App() {
  const [screen, setScreen] = useState('menu'); 
  const [gameMode, setGameMode] = useState(null); 
  const [gameState, setGameState] = useState(null);
  const [playerNum, setPlayerNum] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [message, setMessage] = useState('Welcome to Connect Four!');

  const socket = useRef(null);

  const isMyTurn = gameState && !gameState.game_over && gameState.current_turn === playerNum;

  useEffect(() => {
    if (screen !== 'game' || !socket.current) {
      return;
    }

    socket.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      console.log("Received message:", response);

      switch (response.type) {
        case 'room_created':
          setRoomId(response.data.room_id);
          setPlayerNum(response.data.player_num);
          if (gameMode === 'multiplayer') {
            setMessage('Room created. Share the ID! Waiting for opponent...');
          }
          break;
        case 'room_joined':
          setRoomId(response.data.room_id);
          setPlayerNum(response.data.player_num);
          setMessage('Successfully joined the room!');
          break;
        case 'update_board':
          setGameState(response.data);
          break;
        case 'player_left':
          setMessage('The other player has disconnected. Game over.');
          setGameState(prev => ({ ...prev, game_over: true }));
          break;
        case 'error':
          setMessage(`Error: ${response.data.message}`);
          if (response.data.message === 'Room not found') {
            setTimeout(() => setScreen('multiplayer_menu'), 2000);
          }
          break;
        case 'game_over':
            setGameState(response.data);
            break;
      }
    };

    socket.current.onclose = () => {
      console.log("WebSocket disconnected.");
      if (screen === 'game') {
        setMessage("Connection lost. Please refresh.");
        setGameState(prev => ({ ...prev, game_over: true }));
      }
    };

    socket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setMessage("Connection error. Could not connect to the server.");
    };

  }, [screen, gameMode]);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.game_over) {
      if (gameState.winner === 0) {
        setMessage("It's a draw!");
      } else if (gameState.winner === playerNum) {
        setMessage("Congratulations, you win! 🎉");
      } else {
        setMessage("You lost. Better luck next time!");
      }
    } else {
      setMessage(isMyTurn ? "Your turn!" : "Waiting for opponent's move...");
    }
  }, [gameState, playerNum, isMyTurn]);

  const connectAndCreateRoom = (mode) => {
    socket.current = new WebSocket(WEBSOCKET_URL);
    socket.current.onopen = () => {
      console.log("WebSocket connected, creating room...");
      socket.current.send(JSON.stringify({
        type: 'create_room',
        data: { mode: mode }
      }));
    };
    setGameMode(mode);
    setScreen('game');
  };

  const connectAndJoinRoom = () => {
    if (!joinRoomId.trim()) {
      setMessage("Please enter a Room ID.");
      return;
    }
    socket.current = new WebSocket(WEBSOCKET_URL);
    socket.current.onopen = () => {
      console.log("WebSocket connected, joining room...");
      socket.current.send(JSON.stringify({
        type: 'join_room',
        data: { room_id: joinRoomId.trim() }
      }));
    };
    setScreen('game');
  };

  const handleMakeMove = (columnIndex) => {
    if (isMyTurn && socket.current) {
      socket.current.send(JSON.stringify({
        type: 'make_move',
        data: {
          room_id: roomId,
          column: columnIndex,
          player_num: playerNum
        }
      }));
    }
  };
  
  const handleGoToMenu = () => {
    if(socket.current) {
        socket.current.close();
        socket.current = null;
    }
    setScreen('menu');
    setGameState(null);
    setRoomId('');
    setPlayerNum(null);
    setMessage('Welcome to Connect Four!');
  }

  const renderContent = () => {
    switch (screen) {
      case 'menu':
        return (
          <div className="flex flex-col space-y-4">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold" onClick={() => connectAndCreateRoom('ai')}>
              Play with AI
            </button>
            <button className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold" onClick={() => setScreen('multiplayer_menu')}>
              Play with a Friend
            </button>
          </div>
        );

      case 'multiplayer_menu':
        return (
          <div className="flex flex-col space-y-4 w-full max-w-sm">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold" onClick={() => connectAndCreateRoom('multiplayer')}>
              Create a Room
            </button>
            <div className="flex flex-col items-center space-y-2 pt-4">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                // CHANGED: Added bg-white to the input field
                className="p-3 rounded-lg text-black bg-white text-center w-full" 
              />
              <button className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold w-full" onClick={connectAndJoinRoom}>
                Join Room
              </button>
            </div>
             <button className="text-gray-400 hover:text-white mt-4" onClick={() => setScreen('menu')}>
              &larr; Back to Menu
            </button>
          </div>
        );

      case 'game':
        if (!gameState) {
          return <div>Loading game...</div>;
        }
        return (
          <div className="flex flex-col items-center">
            {roomId && gameMode === 'multiplayer' && (
              // CHANGED: Improved the Room ID display and copy functionality
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
            <GameBoard board={gameState.board} onColumnClick={handleMakeMove} disabled={!isMyTurn} />
            <button className="text-gray-400 hover:text-white mt-8" onClick={handleGoToMenu}>
              &larr; Leave Game & Go to Menu
            </button>
          </div>
        );

      default:
        return <div>Something went wrong.</div>;
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <h1 className="text-5xl font-bold mb-2">Connect Four</h1>
      <p className={`text-xl mb-6 h-8 transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0'}`}>
        {message}
      </p>
      {renderContent()}
    </main>
  );
}

export default App;