import { Game } from './game';
import { Player } from './player';

export interface Room {
  id: string;
  players: Player[];
  host?: Player;
  open: boolean;
  game?: Game;
}