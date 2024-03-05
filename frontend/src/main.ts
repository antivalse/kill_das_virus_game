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
  });

  // Test to start game/show virus
};

// Game function

// Select position of virus
const moveVirus = () => {
  const gridVirus = document.getElementById("gridVirus");
  if (gridVirus) {
    const gridColumn = getRandomNumber(1, 10);
    const gridRow = getRandomNumber(1, 10);
    gridVirus.style.gridColumn = String(gridColumn);
    gridVirus.style.gridRow = String(gridRow);
  }
};

// Get random number
const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Show virus
const showVirus = () => {
  const virus = document.getElementById("gridVirus");
  if (virus) {
    virus.classList.remove("hide");
    virus.addEventListener("click", hideVirus);
  }
};

// Hide virus
const hideVirus = () => {
  const virus = document.getElementById("gridVirus");
  if (virus) {
    virus.classList.add("hide");
    virus.addEventListener("click", moveVirus);
  }
};

// A singel round of game
const gameRound = () => {
  const gridVirus = document.getElementById("gridVirus");
  if (gridVirus) {
    gridVirus.addEventListener("click", moveVirus);
  }
  moveVirus();
  setTimeout(showVirus, getRandomNumber(1500, 10000));
};
gameRound();

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

// Listen for when a new player joins a game

socket.on("playerJoined", (playername, timestamp, waitingRoomId) => {
  //make sure that message only goes to players that are left in waitingRoom

  console.log(
    "A new player joined the waitingroom: ",
    playername,
    timestamp,
    waitingRoomId
  );
});

// Listen for when players leave the waiting room

socket.on("playersLeftWaitingRoom", (playersInWaitingRoom) => {
  console.log("These players left the waiting room: ", playersInWaitingRoom);
});
