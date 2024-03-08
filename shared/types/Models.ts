export {};

export interface Game {
  players: Player[];
}

export interface Player {
  id: string;
  playername: string;
}

export interface Result {
  id: string;
  playerOneHighscore: Number;
  playerTwoHighscore: Number;
  playerOneName: String;
  playerOnePoint: Number;
  playerTwoName: String;
  playerTwoPoint: Number;
  timestamp: Number;
}

export interface Highscore {
  id: string;
  playername: string;
  highscore: number;
}
