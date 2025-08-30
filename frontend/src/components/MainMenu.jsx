import React from 'react';

const MainMenu = ({ onPlayAI, onPlayFriend }) => {
  return (
    <div className="flex flex-col space-y-4">
      <button 
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-bold" 
        onClick={onPlayAI}>
        Play with AI
      </button>
      <button 
        className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-bold" 
        onClick={onPlayFriend}>
        Play with a Friend
      </button>
    </div>
  );
};

export default MainMenu;