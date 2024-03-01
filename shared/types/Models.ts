export {};

export interface Game {
  id: string;
}

export interface Player {
  id: string;
  username: string;
  gameId: string;
}
