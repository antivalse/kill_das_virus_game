export {};

export interface Game {
  players: Player[];
}

export interface Player {
  id: string;
  playername: string;
}
