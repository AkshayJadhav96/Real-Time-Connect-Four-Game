from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uuid
from backend.src.connect_four_game.game_logic import Game
import json
import logging
import asyncio # <--- 1. IMPORT ASYNCIO

# Enable detailed logging
# logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://your-frontend-will-go-here.onrender.com" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage: room_id -> {'game': Game, 'players': [websocket1, websocket2], 'mode': 'ai'/'multiplayer'}
games = {}

@app.get("/")
async def get():
    return HTMLResponse("<h1>Connect Four Backend</h1>")

async def broadcast(room_id: str, message: dict):
    """Send message to all players in a room."""
    if room_id not in games:
        return
    for ws in games[room_id]['players']:
        try:
            await ws.send_json(message)
        except Exception as e:
            logging.error(f"Error broadcasting to {ws}: {e}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive and parse JSON message
            data = await websocket.receive_json()
            msg_type = data.get('type')
            msg_data = data.get('data', {})

            if msg_type == 'create_room':
                mode = msg_data.get('mode')
                if mode not in ['ai', 'multiplayer']:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Invalid mode'}})
                    continue
                room_id = str(uuid.uuid4())[:8]
                game = Game()
                games[room_id] = {'game': game, 'players': [websocket], 'mode': mode}
                await websocket.send_json({'type': 'room_created', 'data': {'room_id': room_id, 'player_num': 1}})
                await broadcast(room_id, {'type': 'update_board', 'data': game.to_dict()})

            elif msg_type == 'join_room':
                room_id = msg_data.get('room_id')
                if room_id not in games:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Room not found'}})
                    continue
                game_data = games[room_id]
                if len(game_data['players']) >= 2:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Room full'}})
                    continue
                if game_data['mode'] == 'ai':
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Cannot join an AI room'}})
                    continue
                game_data['players'].append(websocket)
                await websocket.send_json({'type': 'room_joined', 'data': {'room_id': room_id, 'player_num': 2}})
                await broadcast(room_id, {'type': 'update_board', 'data': game_data['game'].to_dict()})

            elif msg_type == 'make_move':
                room_id = msg_data.get('room_id')
                column = msg_data.get('column')
                player_num = msg_data.get('player_num')
                
                if room_id not in games:
                    continue
                
                game_data = games[room_id]
                game = game_data['game']

                if game.game_over:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Game is already over'}})
                    continue
                
                if game.current_turn != player_num:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Not your turn'}})
                    continue

                move_successful = game.make_player_move(column, player_num)
                
                if not move_successful:
                    await websocket.send_json({'type': 'error', 'data': {'message': 'Invalid move (column might be full)'}})
                    continue

                await broadcast(room_id, {'type': 'update_board', 'data': game.to_dict()})
                
                if game.game_over:
                    await broadcast(room_id, {'type': 'game_over', 'data': game.to_dict()})
                    continue
                
                if game_data['mode'] == 'ai' and game.current_turn == 2:
                    # --- 2. ADD THE DELAY HERE ---
                    await asyncio.sleep(0.5) # Wait for 2 seconds before the AI moves

                    game.make_ai_move()
                    await broadcast(room_id, {'type': 'update_board', 'data': game.to_dict()})
                    
                    if game.game_over:
                        await broadcast(room_id, {'type': 'game_over', 'data': game.to_dict()})

    except WebSocketDisconnect:
        for room_id, game_data in list(games.items()):
            if websocket in game_data['players']:
                game_data['players'].remove(websocket)
                if not game_data['players']:
                    del games[room_id]
                    logging.info(f"Room {room_id} deleted.")
                else:
                    await broadcast(room_id, {'type': 'player_left', 'data': {'message': 'The other player has disconnected.'}})
