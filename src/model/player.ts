export interface Player {
  id: string;         // Socket ID
  name: string;
  score: number;
  roomId?: string;
  isHost: boolean;
}