/*
  Declaration of global variables
*/

//Product info variables
let productName;
let productPrice;
let productImage;

//Timeout IDs
let shakeTimeout;
let toastTimeout;
let warningTimeout;

// Add these variables at the top
let currentGameIndex = 0;
const games = {}; // Will store all games from games.json

/*
  Global variable constants
*/

//The day Costcodle was launched. Used to find game number each day
const costcodleStartDate = new Date("09/21/2023");
const gameNumber = getGameNumber();

//Elements with event listeners to play the game
const input = document.getElementById("guess-input");
const buttonInput = document.getElementById("guess-button");

const infoButton = document.getElementById("info-button");
infoButton.addEventListener("click", switchState);

const statButton = document.getElementById("stat-button");
statButton.addEventListener("click", switchState);

//User stats object
const userStats = JSON.parse(localStorage.getItem("stats")) || {
  numGames: 0,
  numWins: 0,
  winsInNum: [0, 0, 0, 0, 0, 0],
  currentStreak: 0,
  maxStreak: 0,
};

//User game state
const gameState = JSON.parse(localStorage.getItem("state")) || {
  gameNumber: -1,
  guesses: [],
  hasWon: false,
};

/*
  Starts playing the game. Called at beginning of execution
*/

playGame();

function playGame() {
  currentGameIndex = 0;
  fetchGameData();
}

/*
  Acquiring Game Data
*/

//Fetches the current day's game data from the json and starts game
function fetchGameData() {
  fetch("./games.json")
    .then((response) => response.json())
    .then((json) => {
      // Store all games
      Object.assign(games, json);
      
      const totalGames = Object.keys(games).length;
      
      // Check if we've reached the end of games
      if (currentGameIndex >= totalGames) {
        const containerElem = document.getElementById("input-container");
        containerElem.innerHTML = `<button id="share-button" disabled>No More Games!</button>`;
        return;
      }
      
      // Get current game data
      const currentGame = `game-${currentGameIndex + 1}`;
      productName = games[currentGame].name;
      productPrice = games[currentGame].price;
      productPrice = Number(productPrice.slice(1, productPrice.length));
      productImage = games[currentGame].image;

      initializeGame();
    });
}

/*
  Used to initialize the game board using the current game state
*/

function initializeGame() {
  // Reset game state for new game
  gameState.gameNumber = currentGameIndex;
  
  localStorage.setItem("state", JSON.stringify(gameState));
  
  displayProductCard();
  updateGameBoard();

  // Add event listeners if game is not won
  if (!gameState.hasWon) {
    addEventListeners();
  }
}

function convertToShareButton() {
  const containerElem = document.getElementById("input-container");
  const shareButtonElem = document.createElement("button");
  shareButtonElem.setAttribute("id", "share-button");
  containerElem.innerHTML = "";
  shareButtonElem.innerHTML = `Share
  <img src="./assets/share-icon.svg" class="share-icon" />`;
  shareButtonElem.addEventListener("click", copyStats);
  containerElem.appendChild(shareButtonElem);
}

function displayProductCard() {
  //First, update the image container with the new product image
  const imageContainer = document.getElementById("image-container");

  //Create a new image element to dynamically store game image
  const productImageElement = document.createElement("img");
  productImageElement.src = productImage;
  productImageElement.setAttribute("id", "product-image");

  //Add created image to the image container
  imageContainer.appendChild(productImageElement);

  //Select product info element and update the html to display product name
  const productInfo = document.getElementById("product-info");
  productInfo.innerHTML = `<center>${productName}</center>`;
}

function updateGameBoard() {
  updateGuessStat();

  gameState.guesses.forEach((guess, index) => displayGuess(guess, index + 1));
}

function updateGuessStat() {
  const guessStats = document.getElementById("game-stats");
  if (gameState.hasWon) {
    guessStats.innerHTML = `<center>You win! Congratulations!🎉</center>`;
    guessStats.innerHTML += `<center>The price was $${productPrice}</center>`;
    return;
  }

  if (gameState.guesses.length === 6) {
    guessStats.innerHTML = `<center>Better luck next time!</center>`;
    guessStats.innerHTML += `<center>The price was $${productPrice}</center>`;
  } else {
    guessStats.innerHTML = `Guess: ${gameState.guesses.length + 1}/6`;
  }
}

/*
  Event Listeners
*/

//Text input event listener to submit guess when user presses "Enter"
function inputEventListener(event) {
  if (event.key === "Enter") {
    handleInput();
  }
}

//Button event listener to submit guess when user presses guess button
function buttonEventListener() {
  handleInput();
}

function handleInput() {
  const input = document.getElementById("guess-input");
  const strippedString = input.value.replace(/[^0-9.]/g, ''); // Remove everything except numbers and decimal
  
  // Convert to number and fix to 2 decimal places
  let guess = parseFloat(strippedString);
  
  if (isNaN(guess)) {
    displayWarning();
    return;
  }
  
  // Format to 2 decimal places
  guess = guess.toFixed(2);
  
  // Process the guess
  checkGuess(guess);
  
  // Clear input after guess
  input.value = "";

  function displayWarning() {
    clearTimeout(warningTimeout);

    const warningElem = document.getElementById("warning-toast");
    warningElem.classList.remove("hide");
    warningElem.classList.add("animate__flipInX");

    warningTimeout = setTimeout(() => {
      warningElem.classList.remove("animate__flipInX");
      warningElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        warningElem.classList.remove("animate__flipOutX");
        warningElem.classList.add("hide");
      }, 1000);
    }, 2000);
  }
}

function copyStats() {
  let output = `Costcodle #${gameNumber}`;
  if (!gameState.hasWon) {
    output += ` X/6\n`;
  } else {
    output += ` ${gameState.guesses.length}/6\n`;
  }

  gameState.guesses.forEach((guess) => {
    switch (guess.direction) {
      case "&uarr;":
        output += `⬆️`;
        break;
      case "&darr;":
        output += `⬇️`;
        break;
      case "&check;":
        output += `✅`;
        break;
    }

    switch (guess.closeness) {
      case "guess-far":
        output += `🟥`;
        break;
      case "guess-near":
        output += `🟨`;
        break;
    }
    output += `\n`;
  });

  const isMobile =
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i) ||
    navigator.userAgent.match(/IEMobile/i) ||
    navigator.userAgent.match(/Opera Mini/i);

  if (isMobile) {
    if (navigator.canShare) {
      navigator
        .share({
          title: "COSTCODLE",
          text: output,
          url: "https://costcodle.com",
        })
        .catch((error) => console.error("Share failed:", error));
    }
  } else {
    output += `https://costcodle.com`;
    navigator.clipboard.writeText(output);
    displayToast();
  }

  function displayToast() {
    clearTimeout(toastTimeout);

    const toastElem = document.getElementById("share-toast");
    toastElem.classList.remove("hide");
    toastElem.classList.add("animate__flipInX");

    toastTimeout = setTimeout(() => {
      toastElem.classList.remove("animate__flipInX");
      toastElem.classList.add("animate__flipOutX");
      setTimeout(() => {
        toastElem.classList.remove("animate__flipOutX");
        toastElem.classList.add("hide");
      }, 1000);
    }, 3000);
  }
}

function addEventListeners() {
  // First remove any existing listeners to prevent duplicates
  removeEventListeners();
  
  const input = document.getElementById("guess-input");
  const buttonInput = document.getElementById("guess-button");
  
  // Add the event listeners
  input.addEventListener("keydown", inputEventListener);
  buttonInput.addEventListener("click", buttonEventListener);

  // Reset the input state
  input.disabled = false;
  input.value = '';
  input.setAttribute("placeholder", "Enter a guess...");
  
  // Reset the button state
  buttonInput.disabled = false;
  buttonInput.classList.add("active");

  // Add focus/blur handlers
  input.addEventListener("focus", () => {
    input.setAttribute("placeholder", "0.00");
  });
  input.addEventListener("blur", () => {
    input.setAttribute("placeholder", "Enter a guess...");
  });
}

function removeEventListeners() {
  const input = document.getElementById("guess-input");
  const buttonInput = document.getElementById("guess-button");
  
  if (input) {
    input.removeEventListener("keydown", inputEventListener);
    input.removeEventListener("focus", () => {});
    input.removeEventListener("blur", () => {});
  }
  
  if (buttonInput) {
    buttonInput.removeEventListener("click", buttonEventListener);
  }
}

/*
  Handles the logic of Costocodle
  Creates a guess object based on user guess and checks win condition
*/

function checkGuess(guess) {
  const guessObj = { guess, closeness: "", direction: "" };
  const percentAway = calculatePercent(guess);

  if (Math.abs(percentAway) <= 5) {
    guessObj.closeness = "guess-win";
    gameState.hasWon = true;
  } else {
    shakeBox();
    if (Math.abs(percentAway) <= 25) {
      guessObj.closeness = "guess-near";
    } else {
      guessObj.closeness = "guess-far";
    }
  }

  if (gameState.hasWon) {
    guessObj.direction = "&check;";
  } else if (percentAway < 0) {
    guessObj.direction = "&uarr;"; // Price is higher
  } else {
    guessObj.direction = "&darr;"; // Price is lower
  }

  gameState.guesses.push(guessObj);
  localStorage.setItem("state", JSON.stringify(gameState));

  displayGuess(guessObj);

  if (gameState.hasWon) {
    gameWon();
  } else if (gameState.guesses.length === 6) {
    gameLost();
  }
}

/*
  Displays guess object from either game state or a new guess
*/

function displayGuess(guess, index = gameState.guesses.length) {
  const guessContainer = document.getElementById(index);
  guessContainer.innerHTML = ''; // Clear existing content
  
  const guessValueContainer = document.createElement("div");
  const infoContainer = document.createElement("div");

  guessValueContainer.classList.add("guess-value-container", "animate__flipInX");
  infoContainer.classList.add("guess-direction-container", "animate__flipInX");

  guessValueContainer.innerHTML = `$${guess.guess}`;
  infoContainer.classList.add(guess.closeness);
  infoContainer.innerHTML = guess.direction;

  guessContainer.appendChild(guessValueContainer);
  guessContainer.appendChild(infoContainer);

  updateGuessStat();
}

/*
  Helper function to compute guess accuracy
*/

function calculatePercent(guess) {
  return ((guess * 100) / (productPrice * 100)) * 100 - 100;
}

/* 
  End state function to handle win/loss conditions
*/

function gameWon() {
  userStats.numWins++;
  userStats.currentStreak++;
  userStats.winsInNum[gameState.guesses.length - 1]++;
  if (userStats.currentStreak > userStats.maxStreak) {
    userStats.maxStreak = userStats.currentStreak;
  }
  gameState.hasWon = true;

  localStorage.setItem("state", JSON.stringify(gameState));
  localStorage.setItem("stats", JSON.stringify(userStats));
  removeEventListeners();
  convertToNextGameButton();
}

function gameLost() {
  userStats.currentStreak = 0;

  localStorage.setItem("stats", JSON.stringify(userStats));

  removeEventListeners();
  convertToShareButton();
}

/*
  DOM manipulation functions for overlays and animations
*/

function switchState(event) {
  const overlayBtnClicked = event.currentTarget.dataset.overlay;
  const overlayElem = document.getElementById(overlayBtnClicked);
  const title = document.getElementById("title");

  if (title.classList.contains("info-title")) {
    title.classList.remove("info-title");
  }

  if (overlayElem.style.display === "flex") {
    title.innerHTML = `COSTCO<span class="costco-blue">DLE</span>`;
    overlayElem.style.display = "none";
    return;
  }

  if (overlayBtnClicked === "info-overlay") {
    document.getElementById("stats-overlay").style.display = "none";
    renderInfo();
  } else {
    document.getElementById("info-overlay").style.display = "none";
    renderStats();
  }

  function renderInfo() {
    title.innerHTML = `HOW TO <span class="costco-blue">PLAY</span>`;
    if (!title.classList.contains("info-title")) {
      title.classList.add("info-title");
    }
    overlayElem.style.display = "flex";
  }

  function renderStats() {
    title.innerHTML = `GAME <span class="costco-blue">STATS</span>`;

    renderStatistics();
    graphDistribution();

    overlayElem.style.display = "flex";

    function renderStatistics() {
      const numWinsElem = document.getElementById("number-wins");
      numWinsElem.innerHTML = `${userStats.numGames}`;

      const winPercentElem = document.getElementById("win-percent");
      if (userStats.numGames === 0) {
        winPercentElem.innerHTML = `0`;
      } else {
        winPercentElem.innerHTML = `${Math.round(
          (userStats.numWins / userStats.numGames) * 100
        )}`;
      }

      const currentStreakElem = document.getElementById("current-streak");
      currentStreakElem.innerHTML = `${userStats.currentStreak}`;

      const maxStreakElem = document.getElementById("max-streak");
      maxStreakElem.innerHTML = `${userStats.maxStreak}`;
    }

    function graphDistribution() {
      console.log("here");
      userStats.winsInNum.forEach((value, index) => {
        const graphElem = document.getElementById(`graph-${index + 1}`);
        if (userStats.numWins === 0) {
          graphElem.style = `width: 5%`;
        } else {
          graphElem.style = `width: ${
            Math.floor((value / userStats.numWins) * 0.95 * 100) + 5
          }%`;
        }
        graphElem.innerHTML = `${value}`;
      });
    }
  }
}

function shakeBox() {
  clearTimeout(shakeTimeout);
  const infoCard = document.getElementById("info-card");
  if (infoCard.classList.contains("animate__headShake")) {
    infoCard.classList.remove("animate__headShake");
  }
  shakeTimeout = setTimeout(
    () => infoCard.classList.add("animate__headShake"),
    100
  );
}

/*
  Finds current game number based off of Costcodle start date
*/

function getGameNumber() {
  const currDate = new Date();
  let timeDifference = currDate.getTime() - costcodleStartDate.getTime();
  let dayDifference = timeDifference / (1000 * 3600 * 24);

  return Math.ceil(dayDifference);
}

// Replace or add this function to load all games
async function loadGames() {
    try {
        const response = await fetch('games.json');
        const data = await response.json();
        Object.assign(games, data);
        loadGame(); // Load the first game
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Add this function to load the next game
function loadGame() {
    const gameKeys = Object.keys(games);
    if (currentGameIndex >= gameKeys.length) {
        currentGameIndex = 0; // Loop back to start
    }
    
    const currentGame = games[gameKeys[currentGameIndex]];
    
    // Update UI with new game
    document.getElementById('product-image').src = currentGame.image;
    document.getElementById('product-info').textContent = currentGame.name;
    
    // Reset game state
    productPrice = parseFloat(currentGame.price.replace('$', ''));
    gameState.guesses = [];
    gameState.hasWon = false;
    
    // Enable input and button
    const input = document.getElementById('guess-input');
    const button = document.getElementById('guess-button');
    
    input.disabled = false;
    input.value = '';
    button.disabled = false;
    
    // Re-add event listeners
    addEventListeners();
    
    // Update the game board
    updateGameBoard();
}

// Modify the win condition to allow new game
function handleWin() {
    // ... existing win logic ...
    
    // Add a "Next Game" button
    const shareButton = document.querySelector('.share-button');
    shareButton.textContent = 'Next Game';
    shareButton.onclick = () => {
        currentGameIndex++;
        loadGame();
        shareButton.textContent = 'Share';
        // Reset share button onclick to original share function if needed
    };
}

// Call loadGames() instead of just getting today's game
document.addEventListener('DOMContentLoaded', loadGames);

// Add new function to handle moving to next game
function addNextGameButton() {
  const shareButton = document.getElementById("share-button");
  if (shareButton) {
    shareButton.textContent = "Next Game";
    shareButton.onclick = () => {
      currentGameIndex++;
      if (currentGameIndex < Object.keys(games).length) {
        fetchGameData();
      } else {
        shareButton.textContent = "No more games!";
        shareButton.disabled = true;
      }
    };
  }
}

// Add new function to create Next Game button
function convertToNextGameButton() {
  const containerElem = document.getElementById("input-container");
  const nextGameButton = document.createElement("button");
  nextGameButton.setAttribute("id", "share-button"); // Reusing share button styles
  containerElem.innerHTML = "";
  nextGameButton.textContent = "Next Game →";
  
  nextGameButton.addEventListener("click", () => {
    currentGameIndex++;
    resetGameForNext();
  });
  
  containerElem.appendChild(nextGameButton);
}

// Add new function to handle complete game reset
function resetGameForNext() {
  // Clear all guesses
  for (let i = 1; i <= 6; i++) {
    const guessContainer = document.getElementById(i);
    guessContainer.innerHTML = '';
    guessContainer.className = 'guess-container';
  }

  // Reset game state
  gameState.guesses = [];
  gameState.hasWon = false;
  
  // Clear the image container
  const imageContainer = document.getElementById("image-container");
  imageContainer.innerHTML = "";
  
  // Reset input container to original state
  const containerElem = document.getElementById("input-container");
  containerElem.innerHTML = `
    <div id="text-input-container">
      <div id="input-label">$</div>
      <input id="guess-input" type="text" inputmode="decimal" placeholder="Enter a guess...">
    </div>
    <div id="button-container">
      <button id="guess-button" class="active">↵</button>
    </div>
  `;

  // Load next game data first
  fetchGameData();
  
  // Add event listeners after DOM is updated
  setTimeout(() => {
    addEventListeners();
  }, 100);
}
