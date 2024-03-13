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
	increasePlayerScore,
	updatePlayerScore,
} from "../services/player_service";
import {
	createGame,
	getGame,
	getGameWithPlayers,
	increaseRounds,
	resetClicksInDatabase,
	updateClicks,
} from "../services/game_service";
import { ExtendedPlayer, Player } from "@shared/types/Models";
import { getResults } from "../services/result_service";
import { getHighscores } from "../services/highscore_service";

// Create a new debug instance
const debug = Debug("backend:socket_controller");

// // Track waiting players
let waitingPlayers: Player[] = [];

//let playerName: string | null;

let playerOneName: string | null;
let playerTwoName: string | null;

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

// Function to position the virus in the game
const setPositionOfVirus = (
	gameRoomId: string,
	io: Server,
	debug: Debug.Debugger
) => {
	let gridColumn: number = getRandomNumber(1, 10);
	let gridRow: number = getRandomNumber(1, 10);
	let virusDelay: number = getRandomNumber(1500, 10000);

	debug(`gridColumnn is: ${gridColumn}`);
	debug(`gridRow is: ${gridRow} `);
	debug(`delay is: ${virusDelay} `);
	// Emit an event to clients with the position of the virus
	io.to(gameRoomId).emit("setVirusPosition", gridColumn, gridRow, virusDelay);
};

// Function to generate a random number
const getRandomNumber = (min: number, max: number): number => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

// function to create a game and join players to it
const createGameAndJoinPlayers = async (
	waitingPlayers: ExtendedPlayer[],
	io: Server,
	debug: Debug.Debugger,
	getGameWithPlayers: GetGameWithPlayers,
	socket: Socket
) => {
	// create game when there are two players in the waitingPlayers array
	if (waitingPlayers.length === 2) {
		const gameRoom = await createGame(waitingPlayers);
		debug(`Created gameRoom with id:, ${gameRoom.id}`);

		// reset click count in the database for the new game
		// ensuring that clicks are 0 when game starts
		await resetClicksInDatabase(gameRoom.id);

		// Iterate over each player in waitingPlayers and join the game room
		// get socket connection with io.sockets.sockets.get by using the players ID
		// do this only if a player is found
		waitingPlayers.forEach((player) => {
			io.sockets.sockets.get(player.id)?.join(gameRoom.id);
			debug(`Socket ${player.id} joined room ${gameRoom.id}`);
			// Associate player with the game
			player.gameId = gameRoom.id;
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

		// Remove players from waitingPlayers array
		waitingPlayers.splice(0, waitingPlayers.length);

		playerOneName = playersInGame?.players[0].playername || null;
		playerTwoName = playersInGame?.players[1].playername || null;
		debug(
			`Name of player one is: ${playerOneName}. Name of player two is: ${playerTwoName}`
		);
		// make players leave the waiting players array when creating game
		waitingPlayers = [];

		playerOneName = playersInGame?.players[0].playername || null;
		playerTwoName = playersInGame?.players[1].playername || null;
		debug(
			`Name of player one is: ${playerOneName}. Name of player two is: ${playerTwoName}`
		);

		// Emit event to set the position of the virus
		setPositionOfVirus(gameRoom.id, io, debug);

		// Make sure socket joins the room only once
		// players already joined before?
		// socket.join(gameRoom.id);
	}
};

// handle connection function
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	let gameId: string | null;
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
			clickTimes: [],
			score: 0,
			gameId: null,
		});

		waitingPlayers.push(player);

		// Server responds to the client with success and players from waiting players array
		callback({
			success: true,
			game: {
				id: gameId!,
				clicks: 0,
				rounds: 0,
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
			waitingPlayers = [];
			debug("waiting players before joining: ", waitingPlayers);
		}

		if (playerName) {
			let player = {
				id: socket.id,
				playername: playerName,
				score: 0,
				clickTimes: [],
			};
			debug("PLAYERNAME RECIEVED:", playerName);
			waitingPlayers.push(player);
		}
		// Server responds to the client with success and players from waiting players array
		callback({
			success: true,
			game: {
				id: gameId!,
				clicks: 0,
				rounds: 0,
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

		// Update player score in the database
		await updatePlayerScore(playerId, score);

		// Get player from database
		const player = await getPlayer(playerId);
		// abort if there is no player
		if (!player) {
			debug("Player not found. Aborting.");
			return;
		}

		const gameId = player.gameId;
		if (!gameId) {
			debug("Game not found. Aborting.");
			return;
		}

		// Get game from database
		const game = await getGame(gameId);
		if (!game) {
			return;
		}

		// increase clicks in database
		const newClicks = game.clicks + 1;
		await updateClicks(gameId, newClicks);

		if (newClicks >= 2) {
			// increase rounds and clear clicks from database
			const newRounds = game.rounds + 1;
			if (newRounds <= 10) {
				await increaseRounds(gameId, newRounds);
				await updateClicks(gameId, 0);
				// if there are two clicks in database position new virus
				setPositionOfVirus(gameId, io, debug);
			}
		}

		// get game with players

		const playersInGame = await getGameWithPlayers(gameId);
		debug("players that clicked are: ", playersInGame);

		if (!playersInGame) {
			debug("Players not found. Aborting.");
			return;
		}

		// Update clickTimes for the player who clicked
		const currentPlayerIndex = playersInGame.players.findIndex(
			(player) => player.id === playerId
		);
		if (currentPlayerIndex !== -1) {
			const currentPlayer = playersInGame.players[currentPlayerIndex];
			// Check if the player has already reached 10 clickTimes
			if (currentPlayer.clickTimes.length < 10) {
				// Update click time for the current player
				currentPlayer.clickTimes.push(Date.now());
			} else {
				// If the player has already reached 10 clickTimes, do not add more
				console.log("Player has already reached maximum click times.");
			}
		}

		// get clickTimes from players in game and store in database

		const playerOneTime = playersInGame.players[0].clickTime;
		const playerTwoTime = playersInGame.players[1].clickTime;

		// send click times to client to render them

		// Check if both players have clicked
		if (newClicks % 2 === 0) {
			// Convert the array of objects into an array of ExtendedPlayer objects
			const extendedPlayers: ExtendedPlayer[] = playersInGame.players.map(
				(player) => ({
					id: player.id,
					playername: player.playername,
					clickTimes: player.clickTimes,
					clickTime: player.clickTime !== null ? player.clickTime : 0,
					score: 0,
				})
			);

			// send list of players to the game room when both players have clicked
			io.to(gameId).emit("playersClickedVirus", extendedPlayers);
			// increase player score in database after round

			let roundWinner: string | null = null;
			if (playerOneTime && playerTwoTime) {
				if (playerOneTime < playerTwoTime) {
					roundWinner = game.players[0].playername;
					await increasePlayerScore(game.players[0].id);
					console.log(`${game.players[0].playername} gets a point!`);
				} else if (playerTwoTime < playerOneTime) {
					roundWinner = game.players[1].playername;
					await increasePlayerScore(game.players[1].id);
					console.log(`${game.players[1].playername} gets a point!`);
				} else {
					roundWinner = null;
					console.log("It was a tie, no one gets a point");
				}
				// Send round result to client
				io.to(gameId).emit("roundResult", roundWinner);
			}
		}

		//Determine the winner of the game based on player scores.

		const determineGameWinner = (players: Player[]): string => {
			let maxScore = -1;
			let winningPlayerName = "";

			for (const player of players) {
				if (player.score !== null && player.score > maxScore) {
					maxScore = player.score;
					winningPlayerName = player.playername;
				} else if (player.score !== null && player.score === maxScore) {
					// If there's a tie, return immediately
					return "It's a tie!";
				}
			}

			return winningPlayerName;
		};

		if (game.rounds === 10) {
			const gameWinner = determineGameWinner(game.players);
			// Skicka meddelande om spelets slut och avgör vinnaren
			io.to(gameId).emit("endGame");
			io.to(gameId).emit("gameWinner", gameWinner);
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
