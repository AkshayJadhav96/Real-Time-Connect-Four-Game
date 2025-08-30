import React, { useState } from 'react';

const MultiplayerMenu = ({ onCreateRoom, onJoinRoom, onBack }) => {
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleJoin = () => {
    onJoinRoom(joinRoomId);
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-sm">
      <button 
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold" 
        onClick={onCreateRoom}>
        Create a Room
      </button>
      <div className="flex flex-col items-center space-y-2 pt-4">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="p-3 rounded-lg text-black bg-white text-center w-full"
        />
        <button 
          className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold w-full" 
          onClick={handleJoin}>
          Join Room
        </button>
      </div>
      <button className="text-gray-400 hover:text-white mt-4" onClick={onBack}>
        &larr; Back to Menu
      </button>
    </div>
  );
};

export default MultiplayerMenu;