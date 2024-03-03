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
import { addPlayersToGame, createGame } from "../services/game_service";
import { Player } from "@shared/types/Models";

// Create a new debug instance
const debug = Debug("backend:socket_controller");
// Modify your handleConnection function
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// Listen for a player join request from the client when a player submits a form
	socket.on("playerJoinRequest", async (playername, callback) => {
		debug("player wants to join game: ");

		// Create a player in the database
		const player = await createPlayer({
			id: socket.id,
			playername,
		});

		debug("Created player: %o", player);

		// Create a waiting room for the player here?
		// Only proceed with creating the game room if there is another player waiting; otherwise, wait for player 2 to arrive

		let waitingPlayers: Player[] = [];
		waitingPlayers.push(player);
		debug("waiting players: %o", waitingPlayers);

		const gameRoom = await createGame();

		if (waitingPlayers.length === 1) {
			debug("Created gameRoom: %o", gameRoom);

			// Join player to the game room
			socket.join(gameRoom.id);
			debug("Player joined gameRoom: %o", gameRoom.id);

			// Update the game with players
			const gameWithPlayers = await addPlayersToGame(
				gameRoom.id,
				waitingPlayers
			);

			debug("Game with players: %o", gameWithPlayers);

			// Server responds to the client with success and game info
			callback({
				success: true,
				gameId: gameRoom.id,
			});
		}
	});
};
