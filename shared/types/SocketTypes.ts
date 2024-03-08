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
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  playerJoinRequest: (
    playername: string,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
  playersClickedVirus: (
    playerOneClicks: number[],
    playerTwoClicks: number[]
  ) => void;
  virusClicked: () => void;
}

// Waiting room with players

// export interface WaitingRoomInfo extends WaitingRoom {
//   players: Player[];
// }

// Player Join Response
export interface PlayerJoinResponse {
  success: boolean;
  game: Game;

  //waitingRoom: WaitingRoomInfo | null;
  //waitingRoomId: string;
}
