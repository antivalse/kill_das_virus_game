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
import { Player } from "@shared/types/Models";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// Track waiting players
const waitingPlayers: Player[] = [];

// handle connection function
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// Listen for a player join request from the client when a player submits a form
	socket.on("playerJoinRequest", async (playername, callback) => {
		debug(`player ${playername} wants to join the game`);

		// this will be broadcasted to all connected clients
		// for testing purposes only, remove later
		io.emit("playerJoined", playername, Date.now());

		// Add player to waiting players array
		const player = await createPlayer({
			id: socket.id,
			playername,
		});
		waitingPlayers.push(player);

		// Server responds to the client with success and players from waiting players array
		callback({
			success: true,
			game: {
				players: waitingPlayers,
			},
		});

		// create game when there are two players in the waitingPlayers array
		if (waitingPlayers.length === 2) {
			const gameRoom = await createGame(waitingPlayers);
			debug(`Created gameRoom with id:, ${gameRoom.id}`);

			// Iterate over each player in waitingPlayers and join the game room
			waitingPlayers.forEach((player) => {
				io.sockets.sockets.get(player.id)?.join(gameRoom.id);
				debug(`Socket ${player.id} joined room ${gameRoom.id}`);
			});

			// make players leave the waiting players array when creating game
			waitingPlayers.length = 0;

			// Emit an event to inform players that a game is created/started
			io.to(gameRoom.id).emit("gameCreated", gameRoom.id);
		}
	});

	// Handle disconnect
	socket.on("disconnect", async () => {
		debug("a player disconnected", socket.id);

		// Remove the disconnected player from waiting players array
		const index = waitingPlayers.findIndex(
			(player) => player.id === socket.id
		);
		if (index !== -1) {
			waitingPlayers.splice(index, 1);
		}
	});
};

// OLD CODE WITH WAITING ROOM SOCKET

// // handle connection function

// export const handleConnection = (
// 	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
// 	io: Server<ClientToServerEvents, ServerToClientEvents>
// ) => {
// 	debug("🙋 A user connected", socket.id);

// 	// Listen for a player join request from the client when a player submits a form
// 	socket.on("playerJoinRequest", async (playername, callback) => {
// 		debug(`player ${playername} wants to join the game`);

// 		// Add player to waiting room
// 		const waitingRoom = await getWaitingRoom("65e6126154fa5214cd6db856");

// 		// Call everything off if there is no waiting room!
// 		if (!waitingRoom) {
// 			return;
// 		}
// 		// Join the waiting room
// 		socket.join(waitingRoom.id);
// 		debug("joining the waiting room: %o", waitingRoom.id);

// 		// Create a player in the database
// 		const player = await createPlayer({
// 			id: socket.id,
// 			playername,
// 		});
// 		debug("Created player: %o", player);

// 		// add player to waiting room

// 		const waitingRoomWithPlayers = await addPlayerToWaitingRoom(
// 			waitingRoom.id,
// 			player
// 		);
// 		// log array of player(s) in waitingroom
// 		debug("Waiting room with player(s): %o", waitingRoomWithPlayers);
// 		// let players (including new player) know that a player has joined the waiting room
// 		// only let players that are still in the room know this, playes who have left have no access!

// 		// check if player is in waiting room and then emit!

// 		waitingRoomWithPlayers.players.forEach((player) => {
// 			if (player.waitingRoomId === waitingRoom.id) {
// 				io.to(waitingRoom.id).emit(
// 					"playerJoined",
// 					playername,
// 					Date.now(),
// 					waitingRoom.id
// 				);
// 			}
// 		});

// 		// Server responds to the client with success and waiting room info
// 		callback({
// 			success: true,
// 			waitingRoom: {
// 				id: waitingRoom.id,
// 				players: waitingRoomWithPlayers.players,
// 			},
// 		});

// 		// create game in database when there are two players in waitingroom array
// 		// empty the array of waiting players
// 		// Join players to the game room
// 		// Create a start game event??

// 		if (waitingRoomWithPlayers.players.length === 2) {
// 			const gameRoom = await createGame(waitingRoomWithPlayers.players);
// 			debug(`Created gameRoom with id:, ${gameRoom.id}`);

// 			// make players leave the waiting room when joining the game room
// 			// empty waiting room when creating game
// 			await deletePlayersFromWaitingRoom(
// 				"65e6126154fa5214cd6db856",
// 				waitingRoomWithPlayers.players
// 			);

// 			// add players who left waiting room to array "playersWhoLeft..."

// 			// send a notice that the players left
// 			// this is only for testin purposes
// 			io.to(waitingRoom.id).emit(
// 				"playersLeftWaitingRoom",
// 				waitingRoomWithPlayers.players
// 			);

// 			// Emit an event to inform players in waiting room that a game is created
// 			io.to(waitingRoom.id).emit("gameCreated", gameRoom.id);

// 			// leave the waiting room
// 			socket.leave(waitingRoom.id);
// 			// ... and join the gameRoom!
// 			socket.join(gameRoom.id);
// 			debug("Players joined gameRoom: %o", gameRoom.id);
// 		}

// 		// GAME CODE BELOW:

// 		// 	debug("Game with players: %o", gameWithPlayers);

// 		// 	// Get and log the game with the players from database
// 		// 	const gameFromDatabase = await getGameWithPlayers(gameRoom.id);
// 		// 	debug("Game with players from database: %o", gameFromDatabase);
// 		// }

// 		// socket.on("disconnect", async () => {
// 		// 	debug("a player disconnected", socket.id);
// 		// 	debug(
// 		// 		"players left the waiting room ",
// 		// 		waitingRoomWithPlayers.players
// 		// 	);
// 		// });
// 	});
// };
