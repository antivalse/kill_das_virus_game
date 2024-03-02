/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/types/SocketTypes";
import { createPlayer } from "../services/player_service";
import { createGame } from "../services/game_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// Listen for a player join request from klient when player submits form

	socket.on("playerJoinRequest", async (playername, callback) => {
		debug("player wants to join game: ");

		// Create a player in the database

		const player = await createPlayer({
			id: socket.id,
			playername,
		});
		debug("Created player: %o", player);

		// Create a waiting room for player here?
		// Only proceed with creating the game room if there is another player waiting, otherwise wait for player 2 to arrive

		// When server recieves playerJoinRequest it creates new game in the database
		// Add array of players when creating game
		// Update Players with game by using prisma.update

		const gameRoom = await createGame();
		debug("Created gameRoom: %o", gameRoom);

		// Join player to the room

		socket.join(gameRoom.id);

		// Server responds to client with success and game info

		callback({
			success: true,
			gameId: gameRoom.id,
		});
	});
};
