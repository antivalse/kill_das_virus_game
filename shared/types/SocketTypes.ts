import { Game, Player } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  // event when player joins the waiting room
  playerJoined: (playername: string, timestamp: number) => void;
  gameCreated: (gameRoomId: string) => void;
  playersJoinedGame: (playersInGame: Player[]) => void;
  setVirusPosition: (
    gridColumn: number,
    gridRow: number,
    virusDelay: number
  ) => void;
  updateVirusClicks: (virusClicks: number) => void;
  sendResults: (results: ResultData[]) => void;
  sendHighscores: (highscores: HighscoreData[]) => void;
  playerDisconnected: (playername: string) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  playerJoinRequest: (
    playername: string,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
  playerJoinAgainRequest: (
    playername: string,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
  playersClickedVirus: (
    playerOneClicks: number[],
    playerTwoClicks: number[]
  ) => void;
  virusClicked: () => void;
  playerWantsToLeave: () => void;
}

// Player Join Response
export interface PlayerJoinResponse {
  success: boolean;
  game: Game;
}

// Result payload
export interface ResultData {
  playerOneName: string;
  playerTwoName: string;
  playerOneHighscore: number;
  playerTwoHighscore: number;
  playerOnePoint: number;
  playerTwoPoint: number;
  timestamp: number;
}

// Highscore payload

export interface HighscoreData {
  playername: string;
  highscore: number;
}

export type GetGameWithPlayersResult = {
  players: {
    id: string;
    playername: string;
    gameId: string | null;
  }[];
  id: string;
} | null;

export type GetGameWithPlayers = (
  gameId: string
) => Promise<GetGameWithPlayersResult>;
