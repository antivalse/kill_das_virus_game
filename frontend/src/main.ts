import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  HighscoreData,
  PlayerJoinResponse,
  ResultData,
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
const resultPage = document.querySelector("#result-page") as HTMLElement;

const gameWinnerInfoEl = document.querySelector("#game-winner") as HTMLElement;
const trophyImgEl = document.querySelector("#trophy-img") as HTMLImageElement;

// Player Details
let playerName: string | null = null;

// Spinning loaders on startpage

const highScoreSpinningLoaderEl = document.querySelector("#spinning-loader-hs");

const resultSpinningLoaderEl = document.querySelector("#spinning-loader-rs");

// Game Details
const gameInfoEl = document.querySelector("#game-info-text") as HTMLElement;
// Reference to scoreboard scores

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

const startGame = () => {
  // Time variable for comparison with click
  let msSinceEpochOnTimeout = 0;
  // Variable/Boolean for time comparison
  let waitingForClick = false;
  let virusClicks = 0;

  socket.on("updateVirusClicks", (count) => {
    virusClicks = count;
    // Stop timer when both player clicks on virus
    if (virusClicks === 1) {
      clearInterval(timerInterval);
    }
  });

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

          startTimer();

          // Set time for comparison
          msSinceEpochOnTimeout = Date.now();
          console.log(msSinceEpochOnTimeout);

          waitingForClick = true;

          // add eventlistner for click on virus div, hide virus when clicked
          gridVirus.addEventListener("click", () => {
            socket.emit("virusClicked");
            if (waitingForClick) {
              const score = Date.now() - msSinceEpochOnTimeout;
              console.log(score);

              console.log(virusClicks);

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

// restart game function

// Handle case where user wants to play again
// let server know that player wants to play again
// reference to result page

const restartGame = () => {
  // reference to the restart button
  const restartGameBtnEl = document.querySelector(
    "#new-game-button"
  ) as HTMLButtonElement;

  restartGameBtnEl.addEventListener("click", () => {
    console.log("player wants to play again!");
    resultPage.classList.add("hide");
    startPage.classList.add("hide");
    gamePage.classList.remove("hide");

    // get id of player that clicked restart
    // need to get player name here!

    //let playerThatClickedRestart = socket.id;
    let playerThatClickedRestart = socket.id;
    // let server know that player wants to play again
    // create playerJoinAgainRequest where a new player is not created
    if (playerThatClickedRestart) {
      socket.emit(
        "playerJoinAgainRequest",
        playerThatClickedRestart,
        handlePlayerGameJoinRequestCallback
      );
      console.log(
        `Emitted playerJoinRequest event to server AGAIN, player: ${playerThatClickedRestart}`
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
  });
};
// end game function
const endGame = () => {
  // clear timer
  gameInfoEl.innerHTML = "";
  // hide virus
  virus?.classList.add("hide");
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

// timer function
let timerInterval: number;

// start values timer
const startTimer = () => {
  const startTime = Date.now();
  const endTime = startTime + 30000;

  const timerFunc = () => {
    const currentTime = Date.now();
    const remainingTime = endTime - currentTime;

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      gameInfoEl.innerText = "00:00";
      return;
    }

    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    const durationInMinutes = minutes.toString().padStart(2, "0");
    const durationInSeconds = seconds.toString().padStart(2, "o");

    gameInfoEl.innerText = `${durationInMinutes}:${durationInSeconds}`;
  };

  // Call for timeFunc
  timerFunc();

  // update the timer
  timerInterval = setInterval(timerFunc, 1000);
};

// Start countdown

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
  // call on restart game function
  restartGame();
});
