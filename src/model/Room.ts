import { Player } from './Player';

export interface Room {
  id: string;
  players: Player[];
  open: boolean;
}