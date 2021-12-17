import { Box, Game, Guess } from './model/game';
import { Player } from './model/player';
import { Room } from './model/room';

export interface ServerToClientEvents {
  // Room actions
  roomCreated: (room: Room) => void;
  updatePlayers: (room: Room) => void;
  roomClosed: () => void; // Host disconnected

  // Selection Phase
  /**
   * Starts the game for all players. Game specifies active player
   */
  gameStarted: (game: Game) => void;

  // Guessing Phase
  /**
   * Instructs other players to select boxes
   * @param payload
   */
  guessBoxes: (currentPlayer: Player) => void;


  // Scoring Phase
  /**
   * All boxes guessed, report calculated scores
   * @param payload
   */
  reportScores: (game: Game) => void;
}

export interface ClientToServerEvents {
  // Room actions
  createRoom: (playerName: string) => void;
  joinRoom: (playerName: string, roomId: string) => void;

  // Lobby actions
  startGame: () => void;

  // Selection Phase
  boxesSelected: (boxes: Box[]) => void;

  // Guessing Phase
  boxesGuessed: (guesses: Guess) => void;

  // Scoring Phase

  // Misc actions
}

export interface ServerToServerEvents {
  ping: () => void;
}