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
import { getResults } from "../services/result_service";
import { getHighscores } from "../services/highscore_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// Track waiting players
const waitingPlayers: Player[] = [];

// Get and emit results from database to client
const sendResultsToClient = async (socket: Socket) => {
	const results = await getResults();
	socket.emit("sendResults", results);
	debug("results are: ", results);
};

// Get and emit highscores from database to client

const sendHighscoresToClient = async (socket: Socket) => {
	const highscores = await getHighscores();
	socket.emit("sendHighscores", highscores);
	debug("highscores are: ", highscores);
};

// handle connection function
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// get latest results when user connects
	sendResultsToClient(socket);

	// get latest high scores when user connects
	sendHighscoresToClient(socket);

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

			// Number of clicks
			let virusClicks = 0;

			// Listen for clicks on virus from client
			socket.on("virusClicked", () => {
				// Add clicks
				virusClicks++;
				// emit clicks to client side
				io.emit("updateVirusClicks", virusClicks);
			});
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
