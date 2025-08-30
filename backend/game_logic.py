import numpy as np
import sys
import random

# --- AI Helper Functions ---

def get_valid_moves(board):
    """Returns a list of columns that are not full."""
    return [c for c in range(7) if board[0, c] == 0]

def make_temp_move(board, col, player_num):
    """Creates a new board state with a move made."""
    temp_board = board.copy()
    for r in range(5, -1, -1):
        if temp_board[r, col] == 0:
            temp_board[r, col] = player_num
            return temp_board
    raise ValueError(f"Column {col} is full or invalid")

def evaluation_function(board, player_num):
    """
    Evaluates the board state. Positive score is good for the player,
    negative is good for the opponent.
    """
    opponent_num = 2 if player_num == 1 else 1
    score = 0
    
    # Prioritize center column
    center_array = list(board[:, 3])
    score += center_array.count(player_num) * 3

    # Weighted scoring for 2, 3, and 4 in a row
    weights = {2: 10, 3: 50, 4: 10000}
    for num_in_a_row, weight in weights.items():
        score += count_in_a_row(board, player_num, num_in_a_row) * weight
        score -= count_in_a_row(board, opponent_num, num_in_a_row) * weight
    
    return score

def check_sequence(board, player_num, length, count_all=True):
    """
    Helper function to count sequences of given length or check for at least one (for wins).
    If count_all is False, returns 1 if at least one sequence found (for check_win), else 0.
    """
    count = 0
    # Horizontal
    for r in range(6):
        for c in range(7 - (length - 1)):
            if all(board[r, c + i] == player_num for i in range(length)):
                count += 1
                if not count_all and count >= 1:
                    return 1
    # Vertical
    for c in range(7):
        for r in range(6 - (length - 1)):
            if all(board[r + i, c] == player_num for i in range(length)):
                count += 1
                if not count_all and count >= 1:
                    return 1
    # Positive diagonal
    for c in range(7 - (length - 1)):
        for r in range(6 - (length - 1)):
            if all(board[r + i, c + i] == player_num for i in range(length)):
                count += 1
                if not count_all and count >= 1:
                    return 1
    # Negative diagonal
    for c in range(7 - (length - 1)):
        for r in range(length - 1, 6):
            if all(board[r - i, c + i] == player_num for i in range(length)):
                count += 1
                if not count_all and count >= 1:
                    return 1
    return count if count_all else 0

def count_in_a_row(board, player_num, num_in_a_row):
    """Counts how many sets of N in a row a player has."""
    return check_sequence(board, player_num, num_in_a_row, count_all=True)

# --- Alpha-Beta Pruning Algorithm ---

def minimax(board, depth, alpha, beta, maximizing_player, player_num):
    opponent_num = 2 if player_num == 1 else 1
    valid_moves = get_valid_moves(board)
    is_terminal = (check_sequence(board, player_num, 4, count_all=False) > 0 or 
                   check_sequence(board, opponent_num, 4, count_all=False) > 0 or 
                   len(valid_moves) == 0)

    if depth == 0 or is_terminal:
        if check_sequence(board, player_num, 4, count_all=False) > 0:
            return None, sys.maxsize  # Win for player
        if check_sequence(board, opponent_num, 4, count_all=False) > 0:
            return None, -sys.maxsize  # Loss for player
        if len(valid_moves) == 0:
            return None, 0  # Draw
        return None, evaluation_function(board, player_num)

    if maximizing_player:
        value = -sys.maxsize
        best_col = random.choice(valid_moves) if valid_moves else None
        for col in valid_moves:
            temp_board = make_temp_move(board, col, player_num)
            _, new_score = minimax(temp_board, depth - 1, alpha, beta, False, player_num)
            if new_score > value:
                value = new_score
                best_col = col
            alpha = max(alpha, value)
            if alpha >= beta:
                break
        return best_col, value
    else:  # Minimizing player
        value = sys.maxsize
        best_col = random.choice(valid_moves) if valid_moves else None
        for col in valid_moves:
            temp_board = make_temp_move(board, col, opponent_num)
            _, new_score = minimax(temp_board, depth - 1, alpha, beta, True, player_num)
            if new_score < value:
                value = new_score
                best_col = col
            beta = min(beta, value)
            if alpha >= beta:
                break
        return best_col, value

# --- Game Class ---

class Game:
    def __init__(self):
        self.board = np.zeros((6, 7), dtype=int)
        self.game_over = False
        self.current_turn = 1
        self.winner = None

    def make_player_move(self, column: int, player_num: int) -> bool:
        """
        Places a disc for player_num in the given column.
        Returns True if the move was successful, False otherwise.
        Note: Turn and game_over checks are now handled by the server endpoint.
        """
        # Validate column
        if not (0 <= column <= 6) or column not in get_valid_moves(self.board):
            return False  # Invalid or full column
        
        # Find first empty row and place the disc
        for row in range(5, -1, -1):
            if self.board[row, column] == 0:
                self.board[row, column] = self.current_turn
                break
        
        # Check for win
        if self.check_win(self.current_turn):
            self.game_over = True
            self.winner = self.current_turn
        # Check for draw
        elif len(get_valid_moves(self.board)) == 0:
            self.game_over = True
            self.winner = 0  # 0 = draw
        # Otherwise, switch turns
        else:
            self.current_turn = 2 if self.current_turn == 1 else 1
            
        return True

    def make_ai_move(self):
        """AI (player 2) makes a move using minimax."""
        if self.game_over:
            return
        ai_player_num = 2
        best_col, _ = minimax(
            self.board,
            depth=4,
            alpha=-sys.maxsize,
            beta=sys.maxsize,
            maximizing_player=True,
            player_num=ai_player_num,
        )
        if best_col is not None:
            # Here we pass the AI's number directly
            self.make_player_move(best_col, ai_player_num)

    def check_win(self, player_num):
        """Check if given player has 4 in a row."""
        return check_sequence(self.board, player_num, 4, count_all=False) > 0

    def to_dict(self):
        """Convert game state into JSON-safe dictionary."""
        return {
            "board": self.board.tolist(),
            "game_over": self.game_over,
            "current_turn": self.current_turn,
            "winner": self.winner if self.winner is not None else 0,
        }
