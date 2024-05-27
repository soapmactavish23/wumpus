let visitsCount = 0; // Variável para contar as visitas às salas
let gameBoard = [];
let agentPosition = { x: 0, y: 0 };
const boardSize = 4;
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;
let QTable = {};
let gameHistory = []; // Armazenará o histórico de cada partida

document.addEventListener("DOMContentLoaded", () => {
  startGame();
  setInterval(makeIntelligentMove, 1000); // Move a cada 1 segundo
});

function startGame() {
  gameBoard = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill(null)
  );
  createBoard();
  placeItem("gold");
  placeItem("wumpus");
  placeMultipleItems("pit", 3);
  placeAgent();
  visitsCount = 0; // Reinicia a contagem ao começar um novo jogo
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
  visitsCount++; // Incrementa na inicialização
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
    visitsCount++; // Incrementa a contagem de visitas a cada movimento válido
    checkForEvents();
  }
}

function updateAgentPosition() {
  document.querySelector(".agent").remove();
  placeAgent();
}

function checkForEvents() {
  const cellType = gameBoard[agentPosition.x][agentPosition.y];
  if (cellType === "wumpus" || cellType === "pit") {
    alert(`Você encontrou um ${cellType}! Jogo encerrado.`);
    recordGameResult("Perdeu");
  } else if (cellType === "gold") {
    alert("Você encontrou o ouro! Parabéns!");
    recordGameResult("Ganhou");
  }
}

function recordGameResult(result) {
  gameHistory.push({
    result: result,
    moves: visitsCount,
  });
  startGame(); // Restart the game and keep the Q-table
  showReport();
}

function showReport() {
  console.log("Histórico de Partidas:");
  gameHistory.forEach((game, index) => {
    console.log(
      `Partida ${index + 1}: Resultado - ${game.result}, Casas Visitadas - ${
        game.moves
      }`
    );
  });
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
    // Explore
    return actions[Math.floor(Math.random() * actions.length)];
  } else {
    // Exploit
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

function getReward(newState) {
  const [x, y] = newState.substring(1).split("y").map(Number);
  const cellType = gameBoard[x][y];
  if (cellType === "gold") return 100;
  if (cellType === "wumpus" || cellType === "pit") return -100;
  return -1; // Small penalty for each move to encourage finding the goal faster
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
