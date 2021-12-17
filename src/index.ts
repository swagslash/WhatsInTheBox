import * as express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import { Player } from './model/player';
import { Room } from './model/room';
import { createOrGetGame, setNextPlayer } from './server/core/game-manager';
import {
  createOrGetPlayer,
  createRoom,
  joinRoom,
  leaveRoom,
  removePlayer,
  removeRoom,
} from './server/core/room-manager';
import { SocketData } from './socket-data';
import { ClientToServerEvents, ServerToClientEvents, ServerToServerEvents } from './socket-types';

const SERVER_PORT = 3000;

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('hello world');
});

server.listen(SERVER_PORT, () => {
  console.log('App listening on', SERVER_PORT);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, ServerToServerEvents, SocketData>(server);

io.on('connection', (socket) => {
  const playerId = socket.id;
  let room: Room | undefined = undefined;
  let player: Player | undefined;

  console.log('player connected', playerId);

  socket.on('createRoom', (playerName: string) => {
    player = createOrGetPlayer(playerName, playerId);
    room = createRoom();
    joinRoom(player, room.id, true);
    socket.join(room.id);

    console.log('Player', player.name, 'created room', room.id);

    socket.emit('roomCreated', room);
    socket.emit('updatePlayers', room);
  });

  socket.on('joinRoom', (playerName: string, roomId: string) => {
    player = createOrGetPlayer(playerName, playerId);
    room = joinRoom(player, roomId, false);

    if (room !== undefined) {
      socket.join(room.id);

      console.log('Player', player.name, 'joined room', roomId);

      socket.to(room.id).emit('updatePlayers', room);
      socket.emit('updatePlayers', room);
    } else {
      // Game has already started, no new players allowed
      socket.emit('roomClosed');
    }
  });

  socket.on('startGame', () => {
    room.open = false;
    room.game = createOrGetGame(room);
    console.log('SELECTING PHASE', room.id);

    socket.emit('gameStarted', room.game);
    socket.to(room.id).emit('gameStarted', room.game);

    // TODO implement timeout for selection
    // Player did not assign
    // Special phase
    // Immediately report scores
  });

  socket.on('boxesSelected', (boxes) => {
    // TODO clear timeout from 'startGame' step
    // console.log('boxes selected by player', player.id);
    room.game.round.boxes = [...boxes];
    console.log('GUESSING PHASE', room.id);
    socket.to(room.id).emit('guessBoxes', room.game.current);
    socket.emit('guessBoxes', room.game.current);

    // TODO: start timeout for box selection
    // Calculate and update player scores
    // Jump to 'reportScores' phase
  });

  socket.on('boxesGuessed', (guess) => {
    // console.log('Box guessed', player.id, guess);
    room.game.round.guesses.push(guess);


    if ((room.players.length - 1) === room.game.round.guesses.length) {
      // All players gave their guesses
      // TODO: calculate and update player scores

      console.log('GUESSING COMPLETE');

      setNextPlayer(room);
      socket.to(room.id).emit('reportScores', room.game);
      socket.emit('reportScores', room.game);
    } else {
      console.log('GUESSING NOT COMPLETE', room.game.round.guesses.length);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player', playerId, 'disconnected');
    removePlayer(playerId);

    if (room !== undefined) {
      if (player.isHost) {
        console.log('host disconnected', player.id, player.name);
        removeRoom(room.id);
        socket.to(room.id).emit('roomClosed');
        socket.emit('roomClosed');
      } else {
        console.log('leave room', room.id);
        leaveRoom(room.id, playerId);
        socket.to(room.id).emit('updatePlayers', room);
        socket.emit('updatePlayers', room);
      }
    }
  });
});
