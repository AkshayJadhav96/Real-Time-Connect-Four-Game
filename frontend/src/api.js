import axios from "axios";

const API_BASE = "http://localhost:8000"; // FastAPI backend

export async function startAI() {
  const res = await axios.post(`${API_BASE}/start_ai`);
  return res.data; // {session_id}
}

export async function playAIMove(sessionId, column) {
  const res = await axios.post(`${API_BASE}/play_ai/${sessionId}/${column}`);
  return res.data; // {board, current_turn, game_over, winner}
}
