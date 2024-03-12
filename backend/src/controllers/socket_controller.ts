/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	GetGameWithPlayers,
	ServerToClientEvents,
	VirusClickedData,
} from "@shared/types/SocketTypes";
import {
	createPlayer,
	deletePlayer,
	getPlayer,
	updatePlayerScore,
} from "../services/player_service";
import {
	createGame,
	getGame,
	getGameWithPlayers,
} from "../services/game_service";
import { ExtendedPlayer, Player } from "@shared/types/Models";
import { getResults } from "../services/result_service";
import { getHighscores } from "../services/highscore_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// Track waiting players
const waitingPlayers: Player[] = [];

//let playerName: string | null;

let playerOneName: string | null;
let playerTwoName: string | null;

// Access id of room

let gameId: string | null = null;

let clickTimes: number[] = [];

// keep track of clicks
let virusClicks = 0;

// Get and emit results from database to client
const sendResultsToClient = async (socket: Socket) => {
	const results = await getResults();
	socket.emit("sendResults", results);
	//debug("results are: ", results);
};

// Get and emit highscores from database to client

const sendHighscoresToClient = async (socket: Socket) => {
	const highscores = await getHighscores();
	socket.emit("sendHighscores", highscores);
	//debug("highscores are: ", highscores);
};

// function to create a game and join players to it
const createGameAndJoinPlayers = async (
	waitingPlayers: Player[],
	io: Server,
	debug: Debug.Debugger,
	getGameWithPlayers: GetGameWithPlayers,
	socket: Socket
) => {
	// create game when there are two players in the waitingPlayers array
	if (waitingPlayers.length === 2) {
		const gameRoom = await createGame(waitingPlayers);
		debug(`Created gameRoom with id:, ${gameRoom.id}`);
		gameId = gameRoom.id;

		// empty virus clicks when starting a new game
		virusClicks = 0;

		// Iterate over each player in waitingPlayers and join the game room
		// get socket connection with io.sockets.sockets.get by using the players ID
		// do this only if a player is found
		waitingPlayers.forEach((player) => {
			io.sockets.sockets.get(player.id)?.join(gameRoom.id);
			debug(`Socket ${player.id} joined room ${gameRoom.id}`);
		});

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
		// make players leave the waiting players array when creating game
		waitingPlayers.length = 0;

		// const playerOne = playersInGame?.players[0].playername;
		// const playerTwo = playersInGame?.players[1].playername;
		// debug(
		// 	`Name of player one is: ${playerOne}. Name of player two is: ${playerTwo}`
		// );

		playerOneName = playersInGame?.players[0].playername || null;
		playerTwoName = playersInGame?.players[1].playername || null;
		debug(
			`Name of player one is: ${playerOneName}. Name of player two is: ${playerTwoName}`
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

		// Make sure socket joins the room only once
		socket.join(gameRoom.id);
	}
};

// handle connection function
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	// send highscores to the client
	sendResultsToClient(socket);

	// send highscores to the client
	sendHighscoresToClient(socket);

	// get reaction times from client
	// calculate average time for highscore
	socket.on("clickTimes", (playerOneClicks, playerTwoClicks) => {
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

		// if it's a new player creat a new player
		// if it's not a new player add player that wants to play again to the waitingPlayers array
		// Add player to waiting players array
		const player = await createPlayer({
			id: socket.id,
			playername,
			clickTimes,
		});

		waitingPlayers.push(player);

		// Server responds to the client with success and players from waiting players array
		callback({
			success: true,
			game: {
				players: waitingPlayers,
			},
		});

		// call on createGameAndJoinPlayers function

		createGameAndJoinPlayers(
			waitingPlayers,
			io,
			debug,
			getGameWithPlayers,
			socket
		);
	});

	// Handle if a player wants to play again and add them to the waiting players array!
	// Replace playerId with playerName!

	socket.on("playerJoinAgainRequest", async (playerName, callback) => {
		debug("the player that wants to play again is: ", playerName);
		// empty waiting players array if the player wants to play again and again and again
		// Check if there are already waiting players
		const hasWaitingPlayers = waitingPlayers.length > 0;

		// Clear waiting players if no one is waiting
		if (!hasWaitingPlayers) {
			waitingPlayers.length = 0;
			debug("WAITING PLAYERS BEFORE JOINING: ", waitingPlayers);
		}

		if (playerName) {
			let player = {
				id: socket.id,
				playername: playerName,
				clickTimes: clickTimes,
			};
			debug("PLAYERNAME RECIEVED:", playerName);
			waitingPlayers.push(player);
		}
		// Server responds to the client with success and players from waiting players array
		callback({
			success: true,
			game: {
				players: waitingPlayers,
			},
		});
		// Call on createGameAndJoinPlayers function when there are two players in the waitingPlayers array
		if (waitingPlayers.length === 2) {
			createGameAndJoinPlayers(
				waitingPlayers,
				io,
				debug,
				getGameWithPlayers,
				socket
			);
		}
	});

	//Listen for clicks on virus from client
	socket.on("virusClicked", async ({ playerId, score }: VirusClickedData) => {
		debug(
			"Received virusClicked event. Player ID:",
			playerId,
			"Score:",
			score
		);

		// Add clicks
		virusClicks++;
		debug("amount of virus clicks: ", virusClicks);

		// emit clicks to client side
		io.emit("updateVirusClicks", virusClicks);

		try {
			// Use playerId directly in getPlayer function
			const player = await getPlayer(playerId);

			// Log player information
			debug("Player information:", player);

			// if player didn't exist, don't do anything
			if (!player) {
				debug("Player not found. Aborting.");
				return;
			}

			// Update player score in the database
			await updatePlayerScore(playerId, score);

			// Log the successful update
			debug(
				`Updated clickTime for player with ID ${playerId} to ${score}`
			);
		} catch (error) {
			// Log any errors that might occur during the async operations
			console.error("Error processing virusClicked event:", error);
		}

		// get the gameRoom id

		if (gameId) {
			await getGame(gameId);

			// get players in room and access their clickTime
			const playersThatClicked = await getGameWithPlayers(gameId);

			// If there are any players
			if (playersThatClicked && virusClicks === 2) {
				// Convert the array of objects into an array of ExtendedPlayer objects
				const extendedPlayers: ExtendedPlayer[] =
					playersThatClicked.players.map((player) => ({
						id: player.id,
						playername: player.playername,
						clickTimes: player.clickTimes,
						clickTime:
							player.clickTime !== null ? player.clickTime : 0, // Assuming 0 if clickTime is null
					}));

				// send list of players to the game room when both players have clicked
				io.to(gameId).emit("playersClickedVirus", extendedPlayers);

				// reset virusclicks counter
				virusClicks = 0;
			}

			// get click times from players
			const playerOneTime = playersThatClicked?.players[0].clickTime;
			const playerTwoTime = playersThatClicked?.players[1].clickTime;

			// add click times to players and store in database

			// declare a winner
			let roundWinner: string | null = null;
			if (playerOneTime && playerTwoTime) {
				if (playerOneTime < playerTwoTime) {
					roundWinner = playerOneName;
					console.log(`${playerOneName}  gets a point!`);
				} else if (playerTwoTime < playerOneTime) {
					roundWinner = playerTwoName;
					console.log(`${playerTwoName} gets a point!`);
				} else {
					roundWinner = null;
					console.log("It was a tie, no one gets a point");
				}
				// send round result to client
				io.to(gameId).emit("roundResult", roundWinner);
			}
		}
	});

	socket.on("playerWantsToLeave", async () => {
		debug("a player wants to leave us", socket.id);

		// remove the player who wants to leave
		await deletePlayer(socket.id);
		debug("deleted the player with id, ", socket.id);

		//
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

		// find player in order to find out which room they were in

		const player = await getPlayer(socket.id);
		// if player didn't exist, don't do anything
		if (!player) {
			return;
		}

		const gameId = player.gameId;
		const playerName = player.playername;

		// let other player in room know that the other player left
		if (gameId) {
			io.to(gameId).emit("playerDisconnected", playerName);

			// leave the room
			io.sockets.sockets.get(socket.id)?.leave(gameId);
		}
	});
};
