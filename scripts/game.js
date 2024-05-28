let visitsCount = 0;
let gameBoard = [];
let agentPosition = { x: 0, y: 0 };
const boardSize = 4;
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;
let QTable = {};
let gameHistory = [];
let gameInterval;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startGame").addEventListener("click", startGame);
  document.getElementById("stopGame").addEventListener("click", stopGame);
  document.getElementById("restartGame").addEventListener("click", restartGame);
  document.getElementById("showReport").addEventListener("click", toggleReport);
  document.getElementById("closeModal").addEventListener("click", toggleReport);
});

function startGame() {
  stopGame();
  gameInterval = setInterval(makeIntelligentMove, 1000);
  initGame();
}

function stopGame() {
  clearInterval(gameInterval);
}

function restartGame() {
  stopGame();
  initGame();
}

function initGame() {
  gameBoard = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill(null)
  );
  createBoard();
  placeItem("gold");
  placeItem("wumpus");
  placeMultipleItems("pit", 1);
  placeAgent();
  visitsCount = 0;
  displayMessage("Jogo iniciado. Boa sorte!");
}

function createBoard() {
  const boardElement = document.getElementById("gameBoard");
  boardElement.innerHTML = "";
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = i;
      cell.dataset.y = j;
      boardElement.appendChild(cell);
    }
  }
}

function placeAgent() {
  const agent = document.createElement("div");
  agent.className = "agent";
  const initialCell = document.querySelector(
    `[data-x='${agentPosition.x}'][data-y='${agentPosition.y}']`
  );
  initialCell.appendChild(agent);
  visitsCount++;
}

function placeItem(type) {
  let x, y;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (gameBoard[x][y] || (x === 0 && y === 0));
  gameBoard[x][y] = type;
  const cell = document.querySelector(`[data-x='${x}'][data-y='${y}']`);
  const item = document.createElement("div");
  item.className = type;
  cell.appendChild(item);
  if (type === "pit") {
    placeBreezes(x, y);
  }
}

function placeMultipleItems(type, count) {
  for (let i = 0; i < count; i++) {
    placeItem(type);
  }
}

function placeBreezes(x, y) {
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];
  directions.forEach((dir) => {
    const newX = x + dir.x;
    const newY = y + dir.y;
    if (
      newX >= 0 &&
      newX < boardSize &&
      newY >= 0 &&
      newY < boardSize &&
      !gameBoard[newX][newY]
    ) {
      gameBoard[newX][newY] = "breeze";
      const cell = document.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      const breeze = document.createElement("div");
      breeze.className = "breeze";
      cell.appendChild(breeze);
    }
  });
}

function displayMessage(message) {
  document.getElementById("messageDisplay").textContent = message;
}

function recordGameResult(result) {
  gameHistory.push({
    result: result,
    moves: visitsCount,
  });
  updateHistoryTable();
  displayMessage(`Você ${result.toLowerCase()}!`);
}

function updateHistoryTable() {
  const tbody = document
    .getElementById("historyTable")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  gameHistory.forEach((game, index) => {
    let row = tbody.insertRow();
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    cell1.innerHTML = index + 1;
    cell2.innerHTML = game.result;
    cell3.innerHTML = game.moves;
  });
}

function toggleReport() {
  const reportModal = document.getElementById("reportModal");
  if (reportModal.style.display === "block") {
    reportModal.style.display = "none";
  } else {
    reportModal.style.display = "block";
  }
}

function makeIntelligentMove() {
  const state = getGameState();
  const action = chooseAction(state);
  gameStep(action);
}

function getGameState() {
  return `x${agentPosition.x}y${agentPosition.y}`;
}

function chooseAction(state) {
  const actions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (Math.random() < explorationRate) {
    return actions[Math.floor(Math.random() * actions.length)];
  } else {
    if (!QTable[state]) {
      QTable[state] = {};
      actions.forEach((action) => (QTable[state][action] = 0));
    }
    return Object.keys(QTable[state]).reduce((a, b) =>
      QTable[state][a] > QTable[state][b] ? a : b
    );
  }
}

function gameStep(action) {
  const prevState = getGameState();
  moveAgent(action);
  const newState = getGameState();
  const reward = getReward(newState);
  updateQTable(prevState, action, reward, newState);
}

function moveAgent(direction) {
  const movements = {
    ArrowUp: { x: -1, y: 0 },
    ArrowDown: { x: 1, y: 0 },
    ArrowLeft: { x: 0, y: -1 },
    ArrowRight: { x: 0, y: 1 },
  };
  const move = movements[direction];
  const newX = agentPosition.x + move.x;
  const newY = agentPosition.y + move.y;
  if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
    agentPosition.x = newX;
    agentPosition.y = newY;
    updateAgentPosition();
  }
}

function updateAgentPosition() {
  document.querySelector(".agent").remove();
  placeAgent();
  visitsCount++;
  checkForEvents();
}

function checkForEvents() {
  const cellType = gameBoard[agentPosition.x][agentPosition.y];
  if (cellType === "wumpus" || cellType === "pit") {
    recordGameResult("Perdeu");
    stopGame();
  } else if (cellType === "gold") {
    recordGameResult("Ganhou");
    stopGame();
  }
}

function getReward(newState) {
  const [x, y] = newState.substring(1).split("y").map(Number);
  const cellType = gameBoard[x][y];
  if (cellType === "gold") return 100;
  if (cellType === "wumpus" || cellType === "pit") return -100;
  return -1;
}

function updateQTable(prevState, action, reward, newState) {
  if (!QTable[prevState]) {
    QTable[prevState] = {};
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(
      (a) => (QTable[prevState][a] = 0)
    );
  }
  if (!QTable[newState]) {
    QTable[newState] = {};
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(
      (a) => (QTable[newState][a] = 0)
    );
  }
  const oldQValue = QTable[prevState][action];
  const maxFutureQ = Math.max(...Object.values(QTable[newState]));
  const newQValue =
    oldQValue +
    learningRate * (reward + discountFactor * maxFutureQ - oldQValue);
  QTable[prevState][action] = newQValue;
}
