import React, { useState, useRef, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import MultiplayerMenu from './components/MultiplayerMenu';
import GameScreen from './components/GameScreen';

// const WEBSOCKET_URL = "ws://localhost:8000/ws";
const WEBSOCKET_URL = "wss://connect-four-backend-dies.onrender.com/ws";

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'multiplayer_menu', 'game'
  const [gameMode, setGameMode] = useState(null); // 'ai' or 'multiplayer'
  const [gameState, setGameState] = useState(null);
  const [playerNum, setPlayerNum] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('Welcome to Connect Four!');
  
  const socket = useRef(null);
  
  const isMyTurn = gameState && !gameState.game_over && gameState.current_turn === playerNum;

  useEffect(() => {
    // WebSocket message handling logic remains the same...
    if (screen !== 'game' || !socket.current) return;

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
        case 'game_over':
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
      }
    };
    // ... onclose and onerror handlers remain the same ...
  }, [screen, gameMode]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.game_over) {
      if (gameState.winner === 0) setMessage("It's a draw!");
      else if (gameState.winner === playerNum) setMessage("Congratulations, you win! 🎉");
      else setMessage("You lost. Better luck next time!");
    } else {
      setMessage(isMyTurn ? "Your turn!" : "Waiting for opponent's move...");
    }
  }, [gameState, playerNum, isMyTurn]);

  const connectAndCreateRoom = (mode) => {
    socket.current = new WebSocket(WEBSOCKET_URL);
    socket.current.onopen = () => {
      socket.current.send(JSON.stringify({ type: 'create_room', data: { mode } }));
    };
    setGameMode(mode);
    setScreen('game');
  };

  const connectAndJoinRoom = (joinRoomId) => {
    if (!joinRoomId.trim()) {
      setMessage("Please enter a Room ID.");
      return;
    }
    socket.current = new WebSocket(WEBSOCKET_URL);
    socket.current.onopen = () => {
      socket.current.send(JSON.stringify({ type: 'join_room', data: { room_id: joinRoomId.trim() } }));
    };
    setScreen('game');
  };

  const handleMakeMove = (columnIndex) => {
    if (isMyTurn && socket.current) {
      socket.current.send(JSON.stringify({ type: 'make_move', data: { room_id: roomId, column: columnIndex, player_num: playerNum } }));
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
        return <MainMenu onPlayAI={() => connectAndCreateRoom('ai')} onPlayFriend={() => setScreen('multiplayer_menu')} />;
      case 'multiplayer_menu':
        return <MultiplayerMenu onCreateRoom={() => connectAndCreateRoom('multiplayer')} onJoinRoom={connectAndJoinRoom} onBack={() => setScreen('menu')} />;
      case 'game':
        return <GameScreen gameState={gameState} playerNum={playerNum} roomId={roomId} gameMode={gameMode} isMyTurn={isMyTurn} onMakeMove={handleMakeMove} onGoToMenu={handleGoToMenu} />;
      default:
        return <div>Something went wrong.</div>;
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <h1 className="text-5xl font-bold mb-2">Connect Four</h1>
      <p className={`text-xl mb-6 h-8 transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0'}`}>{message}</p>
      {renderContent()}
    </main>
  );
}

export default App;
