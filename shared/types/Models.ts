export {};

export interface Game {
  players: Player[];
  roundsPlayed: number;
}

export interface Player {
  id: string;
  playername: string;
  clickTimes: number[];
  gameId?: string | null;
  points: number;
}

// extended Player interface with clicktime
export interface ExtendedPlayer extends Player {
  clickTime?: number;
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
