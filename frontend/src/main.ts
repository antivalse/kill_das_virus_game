import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  PlayerJoinResponse,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

// Forms
const playerNameFormEl = document.querySelector(
  "#username-form"
) as HTMLFormElement;
const playerNameInputEl = document.querySelector(
  "#username"
) as HTMLInputElement;

// Pages
const startPage = document.querySelector("#start-page") as HTMLElement;
const gamePage = document.querySelector("#game-page") as HTMLElement;

// Player Details
let playerName: string | null = null;

// Game Details
const gameInfoEl = document.querySelector("#game-info-text") as HTMLElement;

//let gameId: string | null = null;

// add eventlistener to player name form
const showGamePage = () => {
  // add eventlistener to player name form

  playerNameFormEl.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get player name
    playerName = playerNameInputEl.value.trim();
    console.log("playerName is: ", playerName);

    if (!playerName) {
      return;
    }

    // send request to server with neccessary information
    // Emit player join request event to server and wait for acknowledgement

    socket.emit(
      "playerJoinRequest",
      playerName,
      handlePlayerGameJoinRequestCallback
    );
    console.log(
      `Emitted playerJoinRequest event to server, player: ${playerName}`
    );

    // Show game page
    startPage.classList.add("hide");
    gamePage.classList.remove("hide");
    // inform waiting player that they are waiting for next player to join
    gameInfoEl.innerText = "Waiting for player two....";
  });

  // Test to start game/show virus
};

// Game function

const startGame = () => {
  // Time variable for comparison with click
  let msSinceEpochOnTimeout = 0;
  // Variable/Boolean for time comparison
  let waitingForClick = false;

  // inform players that game is about to start
  gameInfoEl.innerText = "Get ready to start DAS GAME!";

  socket.on("setVirusPosition", (gridColumn, gridRow, virusDelay) => {
    console.log(
      `gridColumnn is: ${gridColumn} aaand gridRow is: ${gridRow} aaand virusDelay is ${virusDelay}`
    );
    // Show virus
    const placeVirus = (delay: number) => {
      setTimeout(() => {
        const gridVirus = document.getElementById("gridVirus");
        if (gridVirus) {
          // Set position of virus
          gridVirus.style.gridColumn = String(gridColumn);
          gridVirus.style.gridRow = String(gridRow);

          // Remove hideclass
          gridVirus.classList.remove("hide");

          // Set time for comparison
          msSinceEpochOnTimeout = Date.now();
          console.log(msSinceEpochOnTimeout);

          waitingForClick = true;

          // add eventlistner for click on virus div, hide virus when clicked
          gridVirus.addEventListener("click", () => {
            if (waitingForClick) {
              const score = Date.now() - msSinceEpochOnTimeout;
              console.log(score);

              // Hide virus after click
              hideVirus();
            }
          });
        }
      }, delay);
    };
    placeVirus(virusDelay);
  });

  // Hide virus in game
  const hideVirus = () => {
    const virus = document.getElementById("gridVirus");
    if (virus) {
      // add class of hide
      virus.classList.add("hide");
      // remove listning for clicks
      virus.removeEventListener("click", hideVirus);
    }
  };
};

// declare array for clicks

let playerOneClicks: number[] = [];
let playerTwoClicks: number[] = [];

// push reaction time to player click arrays
playerOneClicks = [1, 2, 3];
playerTwoClicks = [4, 5, 6];

// emit clicks to server

socket.emit("playersClickedVirus", playerOneClicks, playerTwoClicks);

/**
 * Socket handlers
 */

// Create a callback-function to handle servers response to player wanting to join game

const handlePlayerGameJoinRequestCallback = (response: PlayerJoinResponse) => {
  if (!response.success) {
    alert("Could not join game!");
    return;
  }

  showGamePage();
};

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
  // call on showGamePage function when connection is established
  showGamePage();
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
  console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});

// Listen for when a new player wants to joins a game
socket.on("playerJoined", (playername, timestamp) => {
  console.log(
    "Msg to all connected clients: A new player wants to join the game: ",
    playername,
    timestamp
  );
});

// Listen for when a game is created

socket.on("gameCreated", (gameRoomId) => {
  // handle event of game being created
  console.log("started the game with id: ", gameRoomId);
  // call on start game function
  startGame();
});

// Listen for a list of online players in game

socket.on("playersJoinedGame", (players) => {
  console.log("these are the players in the game: ", players);
  let playerOne = players[0].playername;
  let playerTwo = players[1].playername;

  console.log(
    `Welcome to the game player one: ${playerOne} and player two: ${playerTwo}`
  );

  // set player's names on score board display when game starts
  const playerOneNameEl = document.querySelector(
    "#player-one-name"
  ) as HTMLElement;
  const playerTwoNameEl = document.querySelector(
    "#player-two-name"
  ) as HTMLElement;

  playerOneNameEl.innerText = playerOne;
  playerTwoNameEl.innerText = playerTwo;
});
