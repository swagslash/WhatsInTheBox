import { Game, Round } from '../../model/game';
import { Room } from '../../model/room';

/**
 * Creates a new game or get an existing one from given room.
 * Starts a new round
 * @param room
 */
export const createOrGetGame = (room: Room): Game => {
  if (room.game === undefined) {
    room.game = {
      current: room.players[0],
      round: createRound(),
    };
  } else {
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
};

const createRound = (): Round => {
  return {
    boxes: [],
    contentPool: ['1', '2', '3', '4', '5'], // Items that can be placed in boxes | TODO generate
    labelPool: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], // Labels that can be assigned to boxes | TODO generate
    guesses: [],
  };
};