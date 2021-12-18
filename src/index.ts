import * as express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import { Phase } from './model/game';
import { Player } from './model/player';
import { Room } from './model/room';
import {
  calculateScores,
  canGuess,
  canStartGuessing,
  canStartSelection,
  createOrGetGame,
  setGamePhase,
  setNextPlayer,
} from './server/core/game-manager';
import {
  closeRoom,
  createOrGetPlayer,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  removePlayer,
} from './server/core/room-manager';
import { SocketData } from './socket-data';
import { ClientToServerEvents, ServerToClientEvents, ServerToServerEvents } from './socket-types';

const SERVER_PORT = +(process.env.SERVER_PORT ?? 3_000);
const SELECTION_TIMEOUT = +(process.env.SELECTION_TIMEOUT ?? 20_000); // 20 seconds
const GUESSING_TIMEOUT = +(process.env.GUESSING_TIMEOUT ?? 20_000);

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
  let room: Room | undefined = undefined;
  let player: Player | undefined = undefined;

  let selectionTimeout;
  let guessingTimeout;

  console.log('[CONNECT]', socket.id);

  socket.on('createRoom', (playerName: string) => {
    if (room && player) {
      // Leave old room if player tries to create a new room
      leaveRoom(room, player);
    }

    room = createRoom();
    player = createOrGetPlayer(playerName, socket.id);

    joinRoom(room, player, true);

    socket.join(room.id);
    socket.emit('roomCreated', room);
  });

  socket.on('joinRoom', (playerName: string, roomId: string) => {
    if (room && player) {
      // Leave old room if player tries to join a new room
      leaveRoom(room, player);
    }

    room = getRoom(roomId);

    if (room === undefined) {
      socket.emit('roomNotFound');
      return;
    }

    player = createOrGetPlayer(playerName, socket.id);
    const success = joinRoom(room, player, false);

    if (success) {
      socket.join(room.id);
      socket.to(room.id)
        .emit('updatePlayers', room.players);
      socket.emit('updatePlayers', room.players);
    } else {
      // Game is open, no new players allowed
      socket.emit('roomClosed');
    }
  });

  socket.on('startGame', () => {
    if (!room || !player) {
      return;
    }

    if (canStartSelection(room)) {
      room.open = false;
      room.game = createOrGetGame(room);

      if (room.game.current !== player) {
        // This player cannot start a game
        return;
      }

      setGamePhase(room, Phase.Selection);

      socket.emit('gameStarted', room.game);
      socket.to(room.id)
        .emit('gameStarted', room.game);

      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      selectionTimeout = setTimeout(() => {
        console.log('[GAME][SELECTING TIMEOUT]', room.id);
        startNextRound();
      }, SELECTION_TIMEOUT);
    }
  });

  socket.on('selectBoxes', (boxes) => {
    if (!room || !player) {
      return;
    }

    if (canStartGuessing(room)) {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      if (guessingTimeout) {
        clearTimeout(guessingTimeout);
      }

      guessingTimeout = setTimeout(() => {
        console.log('[GAME][GUESS TIMEOUT]', room.id);
        startNextRound();
      }, GUESSING_TIMEOUT);

      setGamePhase(room, Phase.Guessing);
      console.log('[GAME][BOXES]', room.id, player.id, boxes);
      room.game.round.boxes = boxes;

      socket.to(room.id)
        .emit('guessBoxes', room.game.current);
      socket.emit('guessBoxes', room.game.current);
    }
  });

  socket.on('guessBoxes', (guess) => {
    if (!room || !player) {
      return;
    }

    if (canGuess(room)) {
      console.log('[GAME][GUESS]', room.id, player.id, guess);
      room.game.round.guesses.push(guess);

      const alreadyGuessed = room.game.round.guesses.length;
      const maxGuesses = room.players.length - 1;               // -1 for active player

      if (alreadyGuessed === maxGuesses) {
        if (guessingTimeout) {
          clearTimeout(guessingTimeout);
        }
        startNextRound();
      } else {
        console.log('[GAME][GUESS MISSING]', room.id, maxGuesses - alreadyGuessed);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('[DISCONNECT]', socket.id);
    if (player && room) {
      removePlayer(player);

      if (room.host === player) {
        closeRoom(room);

        socket.to(room.id)
          .emit('roomClosed');
        socket.emit('roomClosed');
      } else {
        leaveRoom(room, player);

        socket.to(room.id)
          .emit('updatePlayers', room.players);
        socket.emit('updatePlayers', room.players);
      }
    }
  });

  const startNextRound = () => {
    setNextPlayer(room);
    setGamePhase(room, Phase.Scoring);
    calculateScores(room);

    socket.to(room.id)
      .emit('reportScores', room.game);
    socket.emit('reportScores', room.game);
  };
});
