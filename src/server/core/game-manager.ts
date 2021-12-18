import { Game, Phase, Round } from '../../model/game';
import { Room } from '../../model/room';
import { timeouts } from './state';

const SELECTION_TIMEOUT = +(process.env.SELECTION_TIMEOUT ?? 20_000); // 20 seconds
const GUESSING_TIMEOUT = +(process.env.GUESSING_TIMEOUT ?? 20_000);

/**
 * Creates a new game or get an existing one from given room.
 * Starts a new round
 * @param room
 */
export const createOrGetGame = (room: Room): Game => {
  if (room.game === undefined) {
    console.log('[GAME][CREATE]', room.id);
    room.game = {
      current: room.players[0],
      round: createRound(),
      phase: Phase.Selection,
      scores: {},
    };
  } else {
    room.game.phase = Phase.Lobby;
    room.game.round = createRound();
  }

  return room.game;
};

export const setNextPlayer = (room: Room): void => {
  const current = room.game.current;
  const index = room.players.findIndex((p) => p.id === current.id);   // Find current player in room's player list
  let next = 0;                                                       // Fallback to first player if there was a disconnect
  if (index >= 0) {
    next = (index + 1) % room.players.length;                         // Get next player in the player list
  }
  room.game.current = room.players[next];

  console.log('[GAME][NEXT PLAYER]', room.id, room.game.current.id, room.game.current.name);
};

const createRound = (): Round => {
  return {
    boxes: [],
    contentPool: ['1', '2', '3', '4', '5'], // Items that can be placed in boxes | TODO generate
    labelPool: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], // Labels that can be assigned to boxes | TODO generate
    guesses: [],
  };
};

export const setGamePhase = (room: Room, phase: Phase): void => {
  console.log('[GAME][PHASE]', room.id, phase);
  room.game.phase = phase;
};

export const canStartSelection = (room: Room): boolean => {
  return room.game === undefined || [Phase.Lobby, Phase.Scoring].includes(room.game?.phase);
};

export const canStartGuessing = (room: Room): boolean => {
  return Phase.Selection === room.game?.phase;
};

export const canGuess = (room: Room): boolean => {
  return Phase.Guessing === room.game?.phase;
};

export const calculateScores = (room: Room): void => {
  // TODO
};

export const clearSelectionTimeout = (room: Room): void => {
  if (timeouts[room.id]?.selectionTimeout) {
    clearTimeout(timeouts[room.id].selectionTimeout);
  }
};

export const clearGuessingTimeout = (room: Room): void => {
  if (timeouts[room.id]?.guessingTimeout) {
    clearTimeout(timeouts[room.id].guessingTimeout);
  }
};

export const startSelectionTimeout = (room: Room, callback: () => void): void => {
  clearSelectionTimeout(room);

  if (!timeouts[room.id]) {
    timeouts[room.id] = {};
  }

  timeouts[room.id].selectionTimeout = setTimeout(callback, SELECTION_TIMEOUT);
};

export const startGuessingTimeout = (room: Room, callback: () => void): void => {
  clearGuessingTimeout(room);

  if (!timeouts[room.id]) {
    timeouts[room.id] = {};
  }

  timeouts[room.id].guessingTimeout = setTimeout(callback, GUESSING_TIMEOUT);
};


