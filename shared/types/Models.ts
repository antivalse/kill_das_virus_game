export {};

export interface Game {
  players: Player[];
}

export interface Player {
  id: string;
  playername: string;
  clickTimes: number[];
  gameId?: string | null;
}

// extended Player interface with clicktime and points
export interface ExtendedPlayer extends Player {
  clickTime?: number;
  points?: number;
}

// extended Game interface with clicks and rounds
export interface ExtendedPlayer extends Game {
  rounds?: number;
  clicks?: number;
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
