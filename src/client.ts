import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './socket-types';

const roomToJoin = process.env.ROOM_ID ?? undefined;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000');

let playerId: string;

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
});

socket.on('roomClosed', () => {
  console.log('room closed');
});