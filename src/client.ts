import { io, Socket } from 'socket.io-client';
import { Game } from './model/game';
import { Room } from './model/room';
import { ClientToServerEvents, ServerToClientEvents } from './socket-types';

const roomToJoin = process.env.ROOM_ID ?? undefined;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000');

let playerId: string;
let myRoom: Room;
let myGame: Game;

socket.on('connect', () => {
  console.log('ID', socket.id);
  playerId = socket.id;
});

const name = Math.random().toString(16).split('').splice(-10).join('').toUpperCase();

if (roomToJoin === undefined) {
  socket.emit('createRoom', name);
} else {
  socket.emit('joinRoom', name, roomToJoin);
}

socket.on('roomCreated', (room) => {
  console.log('room created', room.id, room.players.map((p) => p.name));
});

socket.on('updatePlayers', (room) => {
  console.log('player joined', room.id, room.players.map((p) => p.name));

  myRoom = room;

  if (room.players.length === 2 && room.host.id === playerId) {
    console.log('start game');
    socket.emit('startGame');

    setTimeout(() => {
      socket.emit('boxesSelected', [
        { content: 'A', labels: ['X', 'Y']},
        { content: 'B', labels: ['X', 'Y']},
        { content: 'C', labels: ['X', 'Y']},
      ])
    }, 5000);
  }
});

socket.on('roomClosed', () => {
  console.log('room closed');
});

socket.on('gameStarted', (game) => {
  myGame = game;
  console.log('game started by host');
  console.log(game);
});

socket.on('guessBoxes', (currentPlayer) => {
  console.log('Guess boxes phase, active player:', currentPlayer.name, currentPlayer.id);

  if (playerId === currentPlayer.id) {
    console.log('wait for guesses');
  } else {
    const timeout = Math.ceil(Math.random() * 5000);
    console.log('guess box', playerId, timeout);
    setTimeout(() => {
      socket.emit('boxesGuessed', { playerId, boxes: [
          'C', 'A', 'Q',
        ]});
    }, timeout);
  }
});

socket.on('reportScores', (game) => {
  console.log('scoring');
  console.log('next player', game.current.name, game.current.id);
});