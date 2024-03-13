import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  HighscoreData,
  PlayerJoinResponse,
  ResultData,
  ServerToClientEvents,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";
import { ExtendedPlayer } from "@shared/types/Models";

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
const resultPage = document.querySelector("#result-page") as HTMLElement;

const gameWinnerInfoEl = document.querySelector("#game-winner") as HTMLElement;
const trophyImgEl = document.querySelector("#trophy-img") as HTMLImageElement;

// Player Details
let playerName: string | null = null;
let playerOne: string | null = null;
let playerTwo: string | null = null;
let playerOneScore: number = 0;
let playerTwoScore: number = 0;
const playerOneScoreEl = document.querySelector(
  "#player-one-score"
) as HTMLSpanElement;
const playerTwoScoreEl = document.querySelector(
  "#player-two-score"
) as HTMLSpanElement;

let playerOneClickedTimes: number[] = [];
let playerTwoClickedTimes: number[] = [];

// Spinning loaders on startpage

const highScoreSpinningLoaderEl = document.querySelector("#spinning-loader-hs");

const resultSpinningLoaderEl = document.querySelector("#spinning-loader-rs");

// Game Details
const gameInfoEl = document.querySelector("#game-info-text") as HTMLElement;
const playerOneTimer = document.querySelector(
  "#player-one-timer"
) as HTMLElement;
const playerTwoTimer = document.querySelector(
  "#player-two-timer"
) as HTMLElement;
// Time variable for comparison with click
let msSinceEpochOnTimeout = 0;
// Variable/Boolean for time comparison
let waitingForClick = false;
// keep track of clicks
// let virusClicks = 0;
// grid container
const gridContainer = document.querySelector(
  "#grid-container"
) as HTMLDivElement;
const gridVirus = document.getElementById("gridVirus");
// game page header
const gamePageHeaderEl = document.querySelector("#game-header") as HTMLElement;
// score board wrapper
const scoreBoardWrapper = document.querySelector(
  "#score-board-display"
) as HTMLDivElement;

let timerInterval: number;

//let gameScoreEl = document.querySelector("#score") as HTMLElement;
const virus = document.getElementById("gridVirus");

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

    // clear input field

    playerNameInputEl.value = "";

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
    gameInfoEl.innerText = "Waiting for player two to join....";
  });

  // Test to start game/show virus
};

// Game functions

// Hide virus in game function
const hideVirus = () => {
  if (virus) {
    // add class of hide
    virus.classList.add("hide");
    // remove listning for clicks
    virus.removeEventListener("click", hideVirus);
  }
};

// Define the handleVirusClick function
function handleVirusClick() {
  // Remove the event listener to prevent multiple clicks
  if (!virus) {
    return;
  }
  virus.removeEventListener("click", handleVirusClick);
  if (waitingForClick) {
    stopTimer();
    const score = Date.now() - msSinceEpochOnTimeout;
    const playerId = socket.id;

    if (!playerId) {
      return;
    }

    // place timer in gameInfoEl
    gameInfoEl.innerText = formatTime(score);

    // playerOneTimer.innerText = formatTime(score);
    //virusClicks++;

    // push each players click time to their clickedTimes array

    if (playerName === playerOne) {
      playerOneClickedTimes.push(score);
    } else if (playerName === playerTwo) {
      playerTwoClickedTimes.push(score);
    }

    // console.log("virus clicks: ", virusClicks);

    socket.emit("virusClicked", { playerId, score });
    console.log(
      `Emitted "virusClicked" event for player ${playerId} with score: ${score}`
    );
  }

  hideVirus();

  // Reset waitingForClick to true for the next click
  waitingForClick = true; // Add this line to reset waitingForClick to true

  // Once both players have clicked, send the clicked times to the server
  socket.emit("clickTimes", playerOneClickedTimes, playerTwoClickedTimes);
  console.log("Emitted clickedTimes to server");

  console.log("Player one clicked times: ", playerOneClickedTimes);
  console.log("Player two clicked times: ", playerTwoClickedTimes);
}

// Handle case where the player did not click
const handleNoClickDetected = () => {
  if (waitingForClick) {
    stopTimer();
    const score = 30000; // Assuming the max time as score when no click is detected
    const playerId = socket.id;

    if (!playerId) {
      return;
    }

    // Update the gameInfoEl to show the max time
    gameInfoEl.innerText = "00:30:000";

    // Emit the "virusClicked" event with the max time as the score
    socket.emit("virusClicked", { playerId, score });
    console.log(
      `Emitted "virusClicked" event for player ${playerId} with score: ${score}`
    );
    // Reset waitingForClick state
    waitingForClick = false;
  }
};

const startGame = () => {
  gamePageHeaderEl.innerText = "KILL DAS VIRUS";
  // show gameInfoEl
  gameInfoEl.classList.remove("hide");
  // show gridcontainer
  gridContainer.classList.remove("hide-div");
  // show scoreboard wrapper div
  scoreBoardWrapper.classList.remove("hide-div");

  // inform players that game is about to start
  gameInfoEl.innerText = "Get ready to start DAS GAME!";

  // Remove the existing event listener before adding a new one
  socket.off("setVirusPosition");

  socket.on("setVirusPosition", (gridColumn, gridRow, virusDelay) => {
    console.log(
      `gridColumnn is: ${gridColumn} aaand gridRow is: ${gridRow} aaand virusDelay is ${virusDelay}`
    );
    // Show virus
    const placeVirus = (delay: number) => {
      setTimeout(() => {
        //const gridVirus = document.getElementById("gridVirus");
        if (gridVirus) {
          // Set position of virus
          gridVirus.style.gridColumn = String(gridColumn);
          gridVirus.style.gridRow = String(gridRow);

          // Remove hideclass
          gridVirus.classList.remove("hide");

          gameInfoEl.innerText = "KLICKEN DAS VIRUS!";

          startTimer();

          // Set time for comparison
          msSinceEpochOnTimeout = Date.now();
          console.log(msSinceEpochOnTimeout);

          waitingForClick = true;

          gridVirus.addEventListener("click", handleVirusClick);
        }
      }, delay);
    };
    placeVirus(virusDelay);
  });
};

// // declare array for clicks

// let playerOneClicks: number[] = [];
// let playerTwoClicks: number[] = [];

// // push reaction time to player click arrays
// playerOneClicks = [1, 2, 3];
// playerTwoClicks = [4, 5, 6];

// // emit clicks to server

// socket.emit("playersClickedVirus", playerOneClicks, playerTwoClicks);

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

// Handle case where user wants to play again
// let server know that player wants to play again
// reference to result page

// reference to the restart button
const restartGameBtnEl = document.querySelector(
  "#new-game-button"
) as HTMLButtonElement;

// Event listener for the restart button
restartGameBtnEl.addEventListener("click", () => {
  console.log("Restart button clicked");
  resultPage.classList.add("hide");
  startPage.classList.add("hide");
  gamePage.classList.remove("hide");

  // empty scores
  playerOneScore = 0;
  playerTwoScore = 0;

  // Clear player clicked times arrays
  playerOneClickedTimes = [];
  playerTwoClickedTimes = [];

  // clear timer interval
  clearInterval(timerInterval);
  // hide virus
  virus?.classList.add("hide");

  // Clear previous event listener for virus click
  virus?.removeEventListener("click", handleVirusClick);
  // clear game info
  gameInfoEl.innerText = "Waiting for player two..";
  // change header when player joins again
  //gamePageHeaderEl.innerText = "Get ready...";
  let playerThatClickedRestart = {
    id: socket.id,
    name: playerName,
  };

  if (playerThatClickedRestart.name) {
    if (!playerThatClickedRestart.name) {
      return;
    }
    // Emit playerJoinAgainRequest event to server
    socket.emit(
      "playerJoinAgainRequest",
      playerThatClickedRestart.name,
      handlePlayerGameJoinRequestCallback
    );

    console.log(
      `Emitted playerJoinAgainRequest event to server AGAIN, player: ${playerThatClickedRestart.name}`
    );
  }
});

// Handle case where player wants to leave the game
// reference to the leave game button
const leaveGameBtnEl = document.querySelector(
  "#quit-game-button"
) as HTMLButtonElement;

leaveGameBtnEl.addEventListener("click", () => {
  console.log("player wants to leave");
  resultPage.classList.add("hide");
  // send event to server so server can delete player from database
  socket.emit("playerWantsToLeave");
  // call on end game for clean up purposes
  endGame();
});
// end game function
const endGame = () => {
  // end the game and give player option to play again on resultpage
  gamePage.classList.add("hide");
  resultPage.classList.remove("hide");
  // empty scores
  playerOneScore = 0;
  playerTwoScore = 0;

  playerOneScoreEl.innerText = "0";
  playerTwoScoreEl.innerText = "0";

  playerOneTimer.innerText = "0 ms";
  playerTwoTimer.innerText = "0 ms";
  // hide gameInfoEl so timer doesn't show up if other player leaves before virus and timer are rendered
  //gameInfoEl.classList.add("hide");
  // hide grid-container
  gridContainer.classList.add("hide-div");
  // clear timer interval
  clearInterval(timerInterval);
  // hide virus
  virus?.classList.add("hide");
  // Clear previous event listener for virus click
  virus?.removeEventListener("click", handleVirusClick);
  // clear game info
  gameInfoEl.innerText = "";
  // hide scoreboard and prevous rounds
  scoreBoardWrapper.classList.add("hide-div");
  // Clear player clicked times arrays
  playerOneClickedTimes = [];
  playerTwoClickedTimes = [];
};

// Function to clear results from startpage when disconneted from server
const clearResults = () => {
  const startPageGameResultUlEl = document.querySelector(
    "#start-page-stats-gameresults"
  );
  if (startPageGameResultUlEl) {
    startPageGameResultUlEl.innerHTML = "";
  }
};

// Function to clear highscores from startpage when disconnected from server
const clearHighscores = () => {
  const startPageHighscoreUlEl = document.querySelector(
    "#start-page-stats-highscore"
  );
  if (startPageHighscoreUlEl) {
    startPageHighscoreUlEl.innerHTML = "";
  }
};

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
  // hide loading spinners when connecting

  highScoreSpinningLoaderEl?.classList.add("hide");
  resultSpinningLoaderEl?.classList.add("hide");

  // call on showGamePage function when connection is established
  showGamePage();
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);

  // call on functions to clear highscore and results
  clearResults();
  clearHighscores();
  // show loading spinner when connecting
  highScoreSpinningLoaderEl?.classList.remove("hide");
  resultSpinningLoaderEl?.classList.remove("hide");

  // end the game and give player option to play again on resultpage
  gamePage.classList.add("hide");
  resultPage.classList.remove("hide");
  // let the player who is left know what happened
  gameWinnerInfoEl.innerText = `Something went wrong, try again later...`;
  // hide the trophy image since nobody won!
  trophyImgEl.classList.add("hide");

  // hide the new game wrapper div
  const newGameWrapperEl = document.querySelector("#new-game-wrapper");
  newGameWrapperEl?.classList.add("hide-div");

  // Code below needs some work for it to function properly
  // // create a button for going back to homepage and place in result-wrapper
  // const goHomeBtn = document.createElement("button");
  // goHomeBtn.innerText = "GO BACK TO HOMEPAGE";
  // goHomeBtn.classList.add("go-home-button");

  // const resultWrapperEl = document.querySelector(
  //   "#result-wrapper"
  // ) as HTMLDivElement;
  // resultWrapperEl.appendChild(goHomeBtn);

  // goHomeBtn.addEventListener("click", () => {
  //   resultPage.classList.add("hide");
  //   startPage.classList.remove("hide");
  // });
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
  playerOne = players[0].playername;
  playerTwo = players[1].playername;

  let playerOneId = players[0].id === socket.id;
  let playerTwoId = players[1].id === socket.id;

  console.log(
    `Welcome to the game player one: ${playerOne} and player two: ${playerTwo}`
  );

  console.log(
    `Welcome to the game player one: ${playerOneId} and player two: ${playerTwoId}`
  );

  console.log("these are the players", players);

  // set player's names on score board display when game starts
  const playerOneNameEl = document.querySelector(
    "#player-one-name"
  ) as HTMLElement;
  const playerTwoNameEl = document.querySelector(
    "#player-two-name"
  ) as HTMLElement;

  // Set players names on scoreboard points
  const playerScoreOneNameEl = document.querySelector(
    "#player-one-name-score"
  ) as HTMLElement;
  const playerScoreTwoNameEl = document.querySelector(
    "#player-two-name-score"
  ) as HTMLElement;

  // Scoreboard names
  playerScoreOneNameEl.innerText = playerOne;
  playerScoreTwoNameEl.innerText = playerTwo;

  // Previous round names
  playerOneNameEl.innerText = playerOne;
  playerTwoNameEl.innerText = playerTwo;

  // // Timer and name of player
  // if (playerOneId) {
  //   playerOneNameEl.innerText = playerOne;
  //   playerTwoNameEl.innerText = playerTwo;
  // } else if (playerTwoId) {
  //   playerOneNameEl.innerText = playerTwo;
  //   playerTwoNameEl.innerText = playerOne;
  // }
});

// timer function
//let timerInterval: number;

// start values timer
const startTimer = () => {
  const startTime = Date.now();

  const timerFunc = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;

    if (elapsedTime >= 30000) {
      stopTimer();
      gameInfoEl.innerText = "00:30:000";
      // inform server that the user did not click
      handleNoClickDetected();
      hideVirus();
      return;
    }

    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const milliseconds = elapsedTime % 1000;

    const durationInMinutes = minutes.toString().padStart(2, "0");
    const durationInSeconds = seconds.toString().padStart(2, "0");
    const durationInMilliseconds = milliseconds.toString().padStart(3, "0");
    gameInfoEl.innerText = `${durationInMinutes}:${durationInSeconds}:${durationInMilliseconds}`;
    //playerOneTimer.innerText = `${durationInMinutes}:${durationInSeconds}:${durationInMilliseconds}`;
  };

  // Call for timeFunc
  timerFunc();

  // update the timer
  timerInterval = setInterval(timerFunc, 1);
};

// Define the stopTimer function to clear the interval:
function stopTimer() {
  clearInterval(timerInterval);
}

// Listen for player click times

// Define a function to handle the "playersClickedVirus" event asynchronously
const handlePlayersClickedVirusAsync = async (players: ExtendedPlayer[]) => {
  console.log("these are the players that clicked: ", players);

  // Update previous time for players after each round
  playerOneTimer.innerText = `${String(players[0].clickTime)} ms`;
  playerTwoTimer.innerText = `${String(players[1].clickTime)} ms`;
};

// Listen for the "playersClickedVirus" event
socket.on("playersClickedVirus", async (players) => {
  await handlePlayersClickedVirusAsync(players);
});

// Listen for winner of each round!
// .. and hand out points to winner

// Define an asynchronous function to handle round result
const handleRoundResult = async (winner: string | null) => {
  console.log("this player won the round: ", winner);
  console.log("Player One:", playerOne);
  console.log("Player Two:", playerTwo);

  if (winner === playerOne) {
    playerOneScore++;
    console.log("player one score: ", playerOneScore);
  } else if (winner === playerTwo) {
    playerTwoScore++;
    console.log("player two score: ", playerTwoScore);
  } else {
    console.log("It was a tie, no points?");
  }

  // Update scoreboard with current points and convert points to string
  playerOneScoreEl.innerText = String(playerOneScore);
  playerTwoScoreEl.innerText = String(playerTwoScore);
};

// Listen for round result and call the asynchronous function
socket.on("roundResult", async (winner) => {
  await handleRoundResult(winner);
});

// socket.on("roundResult", (winner) => {
//   console.log("this player won the round: ", winner);
//   console.log("Player One:", playerOne);
//   console.log("Player Two:", playerTwo);

//   if (winner === playerOne) {
//     playerOneScore++;
//     console.log("player one score: ", playerOneScore);
//   } else if (winner === playerTwo) {
//     playerTwoScore++;
//     console.log("player two score: ", playerTwoScore);
//   } else {
//     ("it was a tie, no points?");
//   }

//   // update scoreboard with current point and convert point to string

//   playerOneScoreEl.innerText = String(playerOneScore);

//   playerTwoScoreEl.innerText = String(playerTwoScore);
// });

// Function to render results to start page
const renderResults = (results: ResultData[]) => {
  const startPageGameResultUlEl = document.querySelector(
    "#start-page-stats-gameresults"
  );

  // Loop through results and create li elements
  results.forEach((result) => {
    // Game Result
    const liGameResultEl = document.createElement("li");
    liGameResultEl.innerHTML = `
      <span class="player-one-points-name">${result.playerOneName}: </span>
      <span class="stats-point">${result.playerOnePoint} p</span> vs
      <span class="player-two-point-name">${result.playerTwoName}: </span>
      <span class="stats-point">${result.playerTwoPoint} p</span>`;

    startPageGameResultUlEl?.appendChild(liGameResultEl);
  });
};

// Listen for the results and then call render function
socket.on("sendResults", (results) => {
  console.log("results are: ", results);

  renderResults(results);
});

const renderHighscores = (results: HighscoreData[]) => {
  const startPageHighscoreUlEl = document.querySelector(
    "#start-page-stats-highscore"
  ) as HTMLUListElement;

  // Loop through results and create li elements
  results.forEach((highscore) => {
    // High Score
    const liHighScoreEl = document.createElement("li");
    liHighScoreEl.innerHTML = `
      <span class="stats-player-name">${highscore.playername}: </span>
      <span class="stats-points">${highscore.highscore} ms</span>
     
    `;

    startPageHighscoreUlEl.appendChild(liHighScoreEl);
  });
};
// Listen for the highscores and then call the render function

socket.on("sendHighscores", (highscores) => {
  console.log("highscores are: ", highscores);
  renderHighscores(highscores);
});

// listen for when a player leaves the game
// end game and go to result page

socket.on("playerDisconnected", (playername) => {
  console.log(`${playername} left the game, so the game has ended!`);

  // end the game
  endGame();

  // give player option to play again on resultpage
  gamePage.classList.add("hide");
  resultPage.classList.remove("hide");
  // let the player who is left know what happened
  gameWinnerInfoEl.innerText = `The game has ended because ${playername} left the game!`;
  // hide the trophy image since nobody won!
  trophyImgEl.classList.add("hide");
});

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((ms % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const milliseconds = (ms % 1000).toString().padStart(3, "0");
  return `${minutes}:${seconds}:${milliseconds}`;
};

// listen for server to end the game after 10 rounds
socket.on("endGame", () => {
  console.log("server says end the game!");

  endGame();
});
