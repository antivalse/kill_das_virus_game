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
import { createGame, getGameWithPlayers } from "../services/game_service";
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

	// get reaction times from client
	// movie to game logic
	socket.on("playersClickedVirus", (playerOneClicks, playerTwoClicks) => {
		debug(
			`player one's clicks: ${playerOneClicks} aaand player two's clicks: ${playerTwoClicks}`
		);
	});

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
			// get socket connection with io.sockets.sockets.get by using the players ID
			// do this only if a player is found
			waitingPlayers.forEach((player) => {
				io.sockets.sockets.get(player.id)?.join(gameRoom.id);
				debug(`Socket ${player.id} joined room ${gameRoom.id}`);
			});

			// make players leave the waiting players array when creating game
			waitingPlayers.length = 0;

			// Emit an event to inform players that a game is created/started
			io.to(gameRoom.id).emit("gameCreated", gameRoom.id);

			// get list of players in room..
			const playersInGame = await getGameWithPlayers(gameRoom.id);

			//...IF there are any players
			if (playersInGame) {
				// send list of players to the room
				io.to(gameRoom.id).emit(
					"playersJoinedGame",
					playersInGame?.players
				);
			}

			const playerOne = playersInGame?.players[0].playername;
			const playerTwo = playersInGame?.players[1].playername;
			debug(
				`Name of player one is: ${playerOne}. Name of player two is: ${playerTwo}`
			);

			// declare grid positions for column and row

			let gridColumn: number = 0;
			let gridRow: number = 0;
			let virusDelay: number = 0;

			// Select position of virus in game
			const positionOfVirus = () => {
				gridColumn = getRandomNumber(1, 10);
				gridRow = getRandomNumber(1, 10);
				virusDelay = getRandomNumber(1500, 10000);
				debug(`gridColumnn is: ${gridColumn}`);
				debug(`gridRow is: ${gridRow} `);
				debug(`delay is: ${virusDelay} `);
			};

			// Get random number
			const getRandomNumber = (min: number, max: number): number => {
				return Math.floor(Math.random() * (max - min + 1)) + min;
			};
			// call on function
			positionOfVirus();

			// emit an event to client with position of virus

			io.to(gameRoom.id).emit(
				"setVirusPosition",
				gridColumn,
				gridRow,
				virusDelay
			);

			// get reaction time from client
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
