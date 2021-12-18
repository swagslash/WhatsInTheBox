import { Player } from './player';

export interface Game {
  current: Player;
  phase: Phase;
  round: Round;
  scores: Record<string, number>;   // Player scores <player-id, score>
}

export interface Round {
  boxes: Box[];           // Boxes
  contentPool: string[];  // Available items to put in boxes
  labelPool: string[];    // Available labels to assign to boxes
  guesses: Guess[];       // Guesses from players
}

export interface Box {
  content: string;        // Content of box
  labels: Label[];        // Labels of box
}

export interface Label {
  label: string;
  position: { x: number, y: number };
}

export interface Guess {
  playerId: string;       // Player that gave guess
  boxes: string[];      // Guess for box. [box-id][box-contents]
}

export enum Phase {
  Lobby,
  Selection,
  Guessing,
  Scoring,
}
