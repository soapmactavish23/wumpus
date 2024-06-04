// Inicialização das Variáveis
let visitsCount = 0;
let gameBoard = [];
let agentPosition = { x: 0, y: 0 };
let boardSize = 4;
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;
let QTable = {};
let gameHistory = [];
let gameInterval;
let agentMap = Array.from({ length: boardSize }, () =>
  new Array(boardSize).fill("?")
);
let hasGold = false;

// Configuração de Eventos
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startGame").addEventListener("click", startGame);
  document.getElementById("stopGame").addEventListener("click", stopGame);
  document.getElementById("restartGame").addEventListener("click", restartGame);
  document.getElementById("showReport").addEventListener("click", toggleReport);
  document.getElementById("closeModal").addEventListener("click", toggleReport);
  document
    .getElementById("boardSizeSelect")
    .addEventListener("change", changeBoardSize);
});

// Funções de Controle do Jogo
function changeBoardSize(event) {
  boardSize = parseInt(event.target.value);
  initGame();
}

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

// Funções de Inicialização e Criação do Tabuleiro
function initGame() {
  gameBoard = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill(null)
  );
  agentMap = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill("?")
  );
  createBoard();
  createMiniMap();
  const initialPositions = placeInitialItems();
  agentPosition = initialPositions.agent;
  placeAgent(agentPosition);
  placeItemAtPosition("home", { x: 0, y: 0, z: -1 });
  visitsCount = 0;
  hasGold = false;
  displayMessage("Jogo iniciado. Boa sorte!");
}

function createBoard() {
  const boardElement = document.getElementById("gameBoard");
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
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

function createMiniMap() {
  const miniMapElement = document.getElementById("miniMap");
  miniMapElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  miniMapElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
  miniMapElement.innerHTML = "";
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.createElement("div");
      cell.className = "miniCell";
      cell.dataset.x = i;
      cell.dataset.y = j;
      miniMapElement.appendChild(cell);
    }
  }
  updateMiniMap();
}

//Funções de Posicionamento de Itens e Agente
function placeInitialItems() {
  const positions = {
    agent: { x: 0, y: 0 },
    gold: generateUniquePosition([]),
    wumpus: null,
    pits: [],
  };

  positions.wumpus = generateUniquePosition([positions.gold]);

  let numberOfPits = 1;

  if (boardSize == 4) {
    numberOfPits = 1;
  } else if (boardSize == 8) {
    numberOfPits = 4;
  } else if (boardSize == 16) {
    numberOfPits = 8;
  }

  for (let i = 0; i < numberOfPits; i++) {
    positions.pits.push(
      generateUniquePosition([
        positions.gold,
        positions.wumpus,
        positions.agent,
        ...positions.pits,
      ])
    );
  }

  placeItemAtPosition("gold", positions.gold);
  placeItemAtPosition("wumpus", positions.wumpus);
  positions.pits.forEach((pitPosition) => {
    placeItemAtPosition("pit", pitPosition);
  });

  return positions;
}

function generateUniquePosition(existingPositions) {
  let x, y;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (isPositionOccupied(x, y, existingPositions));
  return { x, y };
}

function isPositionOccupied(x, y, existingPositions) {
  return (
    existingPositions.some((pos) => pos.x === x && pos.y === y) ||
    (x === 0 && y === 0)
  );
}

function placeAgent(position) {
  const agent = document.createElement("div");
  agent.className = "agent";
  const cell = document.querySelector(
    `[data-x='${position.x}'][data-y='${position.y}']`
  );
  cell.appendChild(agent);
  gameBoard[position.x][position.y] = "agent";
  visitsCount++;
  updateAgentMap(position.x, position.y);
}

function placeItemAtPosition(type, position) {
  gameBoard[position.x][position.y] = type;
  const cell = document.querySelector(
    `[data-x='${position.x}'][data-y='${position.y}']`
  );
  const item = document.createElement("div");
  item.className = type;
  cell.appendChild(item);
  if (type === "pit") {
    placeBreezes(position.x, position.y);
  } else if (type === "wumpus") {
    placeSmells(position.x, position.y);
  }
}

//Funções para Colocação de Brisas e Cheiros
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

function placeSmells(x, y) {
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
      gameBoard[newX][newY] = "smell";
      const cell = document.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      const smell = document.createElement("div");
      smell.className = "smell";
      cell.appendChild(smell);
    }
  });
}
