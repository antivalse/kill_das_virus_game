//import { Player, Game } from "./Models";
export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  playerJoined: (playername: string, timestamp: number) => void; // add: game: string
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  playerJoinRequest: (
    playername: string,
    callback: (response: PlayerJoinResponse) => void
  ) => void;
}

// Player Join Response
export interface PlayerJoinResponse {
  success: boolean;
}
