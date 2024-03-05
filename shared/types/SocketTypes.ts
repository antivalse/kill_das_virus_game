import { Player, WaitingRoom } from "./Models";

//import { Player, Game } from "./Models";
export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  // event when player joins the waiting room
  playerJoined: (
    playername: string,
    timestamp: number,
    waitingRoomId: string
  ) => void;
  playersLeftWaitingRoom: (playersInWaitingRoom: Player[]) => void;
  gameCreated: (gameRoomId: string) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  playerJoinRequest: (
    playername: string,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
}

// Waiting room with players

export interface WaitingRoomInfo extends WaitingRoom {
  players: Player[];
}

// Player Join Response
export interface PlayerJoinResponse {
  success: boolean;
  waitingRoom: WaitingRoomInfo | null;
  //waitingRoomId: string;
}
