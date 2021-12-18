import { io, Socket } from 'socket.io-client';
import { Game } from './model/game';
import { Room } from './model/room';
import { ClientToServerEvents, ServerToClientEvents } from './socket-types';

const roomToJoin = process.env.ROOM_ID ?? undefined;
const playerName = process.env.NAME ?? '><((*>';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000');

let playerId: string;
let myRoom: Room;
let myGame: Game;

socket.on('connect', () => {
  console.log('ID', socket.id);
  playerId = socket.id;
});


if (roomToJoin === undefined) {
  socket.emit('createRoom', playerName);
} else {
  socket.emit('joinRoom', playerName, roomToJoin);
}

socket.on('roomCreated', (room) => {
  console.log('room created', room.id, room.players.map((p) => p.name));
  myRoom = room;
});

socket.on('roomJoined', (room) => {
  myRoom = room;
  console.log('Room joined', 'Host:', room.host.name, room.host.id);
});

socket.on('updatePlayers', (room) => {
  myRoom = room;
  const players = room.players;
  console.log('Players in room', myRoom.id, players.map((p) => p.name));

  // Start game after 2 players joined
  if (myRoom.players.length === 3 && myRoom.host.id === playerId) {
    console.log('I will start the next game in 5 seconds');
    socket.emit('startGame');

    setTimeout(() => {
      socket.emit('selectBoxes', [
        { content: 'A', labels: ['X', 'Y']},
        { content: 'B', labels: ['X', 'Y']},
        { content: 'C', labels: ['X', 'Y']},
      ])
    }, 5_000);
  }
});

socket.on('roomClosed', () => {
  console.log('room closed');
});

socket.on('gameStarted', (game) => {
  myGame = game;
  console.log('Host started game');
});

socket.on('guessBoxes', (currentPlayer) => {
  if (playerId === currentPlayer.id) {
    console.log('I wait for other guesses');
  } else {
    const timeout = Math.ceil(Math.random() * 5000);
    console.log('I give my guess', playerId, timeout);
    setTimeout(() => {
      socket.emit('guessBoxes', { playerId, boxes: [
          'C', 'A', 'Q',
        ]});
    }, timeout);
  }
});

socket.on('reportScores', (game) => {
  console.log('Game finished:', game.scores);
  console.log('next player', game.current.name, game.current.id);

  if (game.current.id === playerId) {
    console.log('I will start the next game');
    socket.emit('startGame');

    setTimeout(() => {
      socket.emit('selectBoxes', [
        { content: 'A', labels: ['X', 'Y']},
        { content: 'B', labels: ['X', 'Y']},
        { content: 'C', labels: ['X', 'Y']},
      ])
    }, 5_000);
  }
});