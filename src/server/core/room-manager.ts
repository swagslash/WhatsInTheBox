import { Player } from '../../model/player';
import { Room } from '../../model/room';
import { players, rooms } from './state';

const generateRoomName = (): string => {
  return Math.random().toString(16).split('').splice(-5).join('');
};

export const getPlayer = (playerId: string): Player | undefined => {
  return players.find((p) => p.id === playerId);
}

/**
 * Creates a new player or gets a new player
 * @param playerName
 * @param playerId
 */
export const createOrGetPlayer = (playerName: string, playerId: string): Player => {
  let player = players.find((p) => p.id === playerId);

  if (player === undefined) {
    player = { id: playerId, name: playerName, score: 0, isHost: false};
    players.push(player);
  }

  return player;
};

export const removePlayer = (id: string): void => {
  const index = players.findIndex((p) => p.id === id);
  if (index >= 0) {
    players.splice(index, 1);
  }
}

export const createRoom = (): Room => {
  const id = generateRoomName();
  const room: Room = { id, open: true, players: []};
  rooms.push(room);

  return room;
};

export const joinRoom = (player: Player, roomId: string, asHost: boolean): Room => {
  const room = rooms.find((r) => r.id === roomId);

  if (room === undefined) {
    return undefined;
  }

  if (room.players.length >= 10) {
    return undefined;
  }

  player.roomId = roomId;
  player.isHost = asHost;
  room.players.push(player);

  if (asHost) {
    room.host = player;
  }

  return room;
};

export const leaveRoom = (roomId: string, playerId: string): boolean => {
  const room = rooms.find((r) => r.id === roomId);

  if (room === undefined) {
    return false;
  }

  const player = players.find((p) => p.id === playerId);
  if (player !== undefined) {
    player.roomId = undefined;
    player.isHost = false;
  }

  const index = room.players.findIndex((p) => p.id === playerId);
  if (index >= 0) {
    room.players.splice(index, 1);
  }

  if (room.players.length === 0) {
    console.log('remove empty room', room.id);
    removeRoom(roomId);
  }
};

export const removeRoom = (roomId: string): void => {
  const index = rooms.findIndex((r) => r.id === roomId);
  if (index >= 0) {
    const room = rooms.splice(index, 1)[0];

    // Remove remaining players
    for (let player of room.players) {
      removePlayer(player.id);
    }
  }
};
