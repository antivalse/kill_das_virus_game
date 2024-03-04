/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from "@shared/types/SocketTypes";
import {
	createPlayer,
	getPlayersInWaitingRoom,
} from "../services/player_service";
import { createGame, getGameWithPlayers } from "../services/game_service";
import { Player } from "@shared/types/Models";
import {
	addPlayersToWaitingRoom,
	deletePlayersFromWaitingRoom,
	getWaitingRoom,
} from "../services/waitingRoom_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");
// Modify your handleConnection function
// export const handleConnection = (
// 	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
// 	io: Server<ClientToServerEvents, ServerToClientEvents>
// ) => {
// 	debug("🙋 A user connected", socket.id);

// 	// Listen for a player join request from the client when a player submits a form
// 	socket.on("playerJoinRequest", async (playername, callback) => {
// 		debug("player wants to join game: ");

// 		// Create a player in the database
// 		const player = await createPlayer({
// 			id: socket.id,
// 			playername,
// 		});

// 		debug("Created player: %o", player);

// 		// Create a waiting room for the player here?
// 		// Only proceed with creating the game room if there is another player waiting; otherwise, wait for player 2 to arrive

// 		let waitingPlayers: Player[] = [];
// 		waitingPlayers.push(player);
// 		debug("waiting players: %o", waitingPlayers);

// 		if (waitingPlayers.length === 2) {
// 			const gameRoom = await createGame();
// 			debug("Created gameRoom: %o", gameRoom);

// 			// Join player to the game room
// 			socket.join(gameRoom.id);
// 			debug("Player joined gameRoom: %o", gameRoom.id);

// 			// Update the game with players
// 			const gameWithPlayers = await addPlayersToGame(
// 				gameRoom.id,
// 				waitingPlayers
// 			);

// 			debug("Game with players: %o", gameWithPlayers);

// 			// Get and log the game with the players from database
// 			const gameFromDatabase = await getGameWithPlayers(gameRoom.id);
// 			debug("Game with players from database: %o", gameFromDatabase);

// 			// Server responds to the client with success and game info
// 			callback({
// 				success: true,
// 				gameId: gameRoom.id,
// 			});
// 		}
// 	});
// };

export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);
	// create array with waiting players
	let waitingPlayers: Player[] = [];

	// Listen for a player join request from the client when a player submits a form
	socket.on("playerJoinRequest", async (playername, callback) => {
		debug(`player ${playername} wants to join the game`);

		// Add player to waiting room
		const waitingRoom = await getWaitingRoom("65e6126154fa5214cd6db856");

		// Call everything off if there is no waiting room!
		if (!waitingRoom) {
			return;
		}
		// Join the waiting room
		socket.join(waitingRoom.id);
		debug("joining the waiting room: %o", waitingRoom.id);

		// Create a player in the database
		const player = await createPlayer({
			id: socket.id,
			playername,
		});
		debug("Created player: %o", player);

		// add created player to array

		waitingPlayers.push(player);
		debug("waiting players: %o", waitingPlayers);

		// add player to waiting room

		const waitingRoomWithPlayers = await addPlayersToWaitingRoom(
			waitingRoom.id,
			waitingPlayers
		);
		// log array of players in waitingroom
		debug("Waiting room with players: %o", waitingRoomWithPlayers);

		// Server responds to the client with success and game info
		callback({
			success: true,
			waitingRoomId: waitingRoom.id,
		});

		// create game in database when there are two players in waitingroom array
		// empty the array of waiting players

		if (waitingRoomWithPlayers.players.length === 2) {
			const gameRoom = await createGame(waitingRoomWithPlayers.players);
			debug("Created gameRoom: %o", gameRoom);

			// empty waiting room when creating game
			await deletePlayersFromWaitingRoom(
				"65e6126154fa5214cd6db856",
				waitingRoomWithPlayers.players
			);
			// Join players to the game room
			// Does this work?
			socket.join(gameRoom.id);
			debug("Players joined gameRoom: %o", gameRoom.id);
		}

		// // Listen for start game event

		// } )

		// // create the game when there are two players in the waiting players array
		// // add players as data when creating game
		// // empty waitingPlayers array
		// // make sure players leave the waiting room

		// if (waitingPlayers.length === 2) {
		// 	const gameRoom = await createGame();
		// 	debug("Created gameRoom: %o", gameRoom);

		// 	// Join player to the game room
		// 	socket.join(gameRoom.id);
		// 	debug("Player joined gameRoom: %o", gameRoom.id);

		// 	// Update the game with players
		// 	const gameWithPlayers = await addPlayersToGame(
		// 		gameRoom.id,
		// 		waitingPlayers
		// 	);

		// 	debug("Game with players: %o", gameWithPlayers);

		// 	// Get and log the game with the players from database
		// 	const gameFromDatabase = await getGameWithPlayers(gameRoom.id);
		// 	debug("Game with players from database: %o", gameFromDatabase);
		// }
	});
};
