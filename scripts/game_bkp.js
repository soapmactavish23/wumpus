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
const fixedBoard = [
  ["agent", null, null, "wumpus"],
  [null, "pit", null, null],
  [null, null, null, "pit"],
  [null, "gold", null, null],
];

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
  initGame();
  gameInterval = setInterval(makeIntelligentMove, 1000);
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
  const agentVersion = document.getElementById("agentVersion").value;
  if (agentVersion === "1") {
    createBoard();
    createMiniMap();
    const initialPositions = placeInitialItems();
    agentPosition = initialPositions.agent;
    placeAgent(agentPosition);
    placeItemAtPosition("home", { x: 0, y: 0, z: -1 });
  } else {
    createFixedBoard();
    createMiniMap();
    placeFixedItems();
    agentPosition = { x: 0, y: 0 };
    placeAgent(agentPosition);
    placeItemAtPosition("home", { x: 0, y: 0, z: -1 });
  }
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

function createFixedBoard() {
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

function placeFixedItems() {
  for (let i = 0; i < fixedBoard.length; i++) {
    for (let j = 0; j < fixedBoard[i].length; j++) {
      if (fixedBoard[i][j] !== null) {
        placeItemAtPosition(fixedBoard[i][j], { x: i, y: j });
      }
    }
  }
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
  const agentElement = document.querySelector(".agent");
  if (agentElement) {
    agentElement.remove();
  }
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

// Funções de Exibição de Mensagens e Resultados do Jogo

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

// Funções de Movimento e Inteligência do Agente
function makeIntelligentMove() {
  const state = getGameState();
  let action;
  if (hasGold) {
    action = chooseActionForReturn();
  } else {
    action = chooseAction(state);
  }
  gameStep(action);
}

function getGameState() {
  return `x${agentPosition.x}y${agentPosition.y}`;
}

function chooseAction(state) {
  const actions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const safeActions = actions.filter((action) => {
    const [newX, newY] = getNewPosition(
      agentPosition.x,
      agentPosition.y,
      action
    );
    return (
      isValidPosition(newX, newY) &&
      agentMap[newX][newY] !== "P" &&
      agentMap[newX][newY] !== "W"
    );
  });

  if (safeActions.length > 0) {
    return prioritizeNewPositions(safeActions);
  } else if (Math.random() < explorationRate) {
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

function prioritizeNewPositions(actions) {
  const newPositions = actions.filter((action) => {
    const [newX, newY] = getNewPosition(
      agentPosition.x,
      agentPosition.y,
      action
    );
    return agentMap[newX][newY] === "?";
  });
  return newPositions.length > 0
    ? newPositions[Math.floor(Math.random() * newPositions.length)]
    : actions[Math.floor(Math.random() * actions.length)];
}

function getNewPosition(x, y, action) {
  const movements = {
    ArrowUp: { x: -1, y: 0 },
    ArrowDown: { x: 1, y: 0 },
    ArrowLeft: { x: 0, y: -1 },
    ArrowRight: { x: 0, y: 1 },
  };
  const move = movements[action];
  return [x + move.x, y + move.y];
}

function isValidPosition(x, y) {
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

function gameStep(action) {
  const prevState = getGameState();
  moveAgent(action);
  const newState = getGameState();
  const reward = getReward(newState);
  updateQTable(prevState, action, reward, newState);
}

function moveAgent(direction) {
  const [newX, newY] = getNewPosition(
    agentPosition.x,
    agentPosition.y,
    direction
  );
  if (isValidPosition(newX, newY)) {
    agentPosition.x = newX;
    agentPosition.y = newY;
    updateAgentPosition();
  }
}

function updateAgentPosition() {
  const agentElement = document.querySelector(".agent");
  if (agentElement) {
    agentElement.remove();
  }
  const agent = document.createElement("div");
  agent.className = "agent";
  const cell = document.querySelector(
    `[data-x='${agentPosition.x}'][data-y='${agentPosition.y}']`
  );
  cell.appendChild(agent);
  visitsCount++;
  updateAgentMap(agentPosition.x, agentPosition.y);
  checkForEvents();
}

// Funções de Atualização do Mapa
function updateAgentMap(x, y) {
  const cellType = gameBoard[x][y];
  agentMap[x][y] = cellType === null ? " " : cellType.charAt(0).toUpperCase();
  if (cellType === "breeze") {
    markPossiblePits(x, y);
  } else if (cellType === "smell") {
    markPossibleWumpus(x, y);
  }
  deducePitPosition();
  deduceWumpusPosition();
  updateMiniMap();
}

function markPossiblePits(x, y) {
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
      isValidPosition(newX, newY) &&
      (agentMap[newX][newY] === "?" || agentMap[newX][newY] === "P")
    ) {
      agentMap[newX][newY] = "P"; // Possible pit
    }
  });
  deducePitPosition();
}

function markPossibleWumpus(x, y) {
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
      isValidPosition(newX, newY) &&
      (agentMap[newX][newY] === "?" || agentMap[newX][newY] === "W")
    ) {
      agentMap[newX][newY] = "W"; // Possible Wumpus
    }
  });
  deduceWumpusPosition();
}

//Funções de Dedução de Posições
function deducePitPosition() {
  const breezePositions = [];

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (agentMap[i][j] === "B") {
        breezePositions.push({ x: i, y: j });
      }
    }
  }

  const pitCandidates = {};
  breezePositions.forEach((breeze) => {
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ];
    directions.forEach((dir) => {
      const newX = breeze.x + dir.x;
      const newY = breeze.y + dir.y;
      if (
        isValidPosition(newX, newY) &&
        (agentMap[newX][newY] === "P" || agentMap[newX][newY] === "?")
      ) {
        const key = `${newX},${newY}`;
        if (!pitCandidates[key]) {
          pitCandidates[key] = 0;
        }
        pitCandidates[key]++;
      }
    });
  });

  const maxCount = Math.max(...Object.values(pitCandidates));
  const probablePits = Object.keys(pitCandidates).filter(
    (key) => pitCandidates[key] === maxCount
  );

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (agentMap[i][j] === "P" && !probablePits.includes(`${i},${j}`)) {
        agentMap[i][j] = "?";
      }
    }
  }

  probablePits.forEach((key) => {
    const [x, y] = key.split(",").map(Number);
    agentMap[x][y] = "P";
  });
}

function deduceWumpusPosition() {
  const smellPositions = [];

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (agentMap[i][j] === "S") {
        smellPositions.push({ x: i, y: j });
      }
    }
  }

  const wumpusCandidates = {};
  smellPositions.forEach((smell) => {
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ];
    directions.forEach((dir) => {
      const newX = smell.x + dir.x;
      const newY = smell.y + dir.y;
      if (
        isValidPosition(newX, newY) &&
        (agentMap[newX][newY] === "W" || agentMap[newX][newY] === "?")
      ) {
        const key = `${newX},${newY}`;
        if (!wumpusCandidates[key]) {
          wumpusCandidates[key] = 0;
        }
        wumpusCandidates[key]++;
      }
    });
  });

  const maxCount = Math.max(...Object.values(wumpusCandidates));
  const probableWumpus = Object.keys(wumpusCandidates).filter(
    (key) => wumpusCandidates[key] === maxCount
  );

  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (agentMap[i][j] === "W" && !probableWumpus.includes(`${i},${j}`)) {
        agentMap[i][j] = "?";
      }
    }
  }

  probableWumpus.forEach((key) => {
    const [x, y] = key.split(",").map(Number);
    agentMap[x][y] = "W";
  });
}

// Funções de Atualização do Mini Mapa
function updateMiniMap() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const cell = document.querySelector(
        `#miniMap .miniCell[data-x='${i}'][data-y='${j}']`
      );
      cell.innerHTML = "";
      cell.style.backgroundSize = "contain";
      cell.style.backgroundRepeat = "no-repeat";
      cell.style.backgroundPosition = "center";
      switch (agentMap[i][j]) {
        case "A":
          cell.style.backgroundImage = "url('./images/player.png')";
          break;
        case "G":
          cell.style.backgroundImage = "url('./images/gold.png')";
          break;
        case "W":
          cell.style.backgroundImage = "url('./images/wumpus.png')";
          break;
        case "P":
          cell.style.backgroundImage = "url('./images/buraco.png')";
          break;
        case "B":
          cell.style.backgroundImage = "url('./images/vento.png')";
          break;
        case "S":
          cell.style.backgroundImage = "url('./images/smell.png')";
          break;
        case "H":
          cell.style.backgroundImage = "url('./images/home.png')";
          break;
        case " ":
          cell.style.backgroundImage = "none";
          break;
        default:
          cell.style.backgroundImage = "url('./images/interrogacao.png')";
          break;
      }
    }
  }
}

//Funções de Checagem de Eventos e Recompensas
function checkForEvents() {
  const cellType = gameBoard[agentPosition.x][agentPosition.y];
  if (cellType === "wumpus" || cellType === "pit") {
    recordGameResult("Perdeu");
    stopGame();
  } else if (cellType === "gold") {
    displayMessage("Tesouro encontrado! Voltando para casa...");
    hasGold = true;
  } else if (hasGold && agentPosition.x === 0 && agentPosition.y === 0) {
    recordGameResult("Venceu");
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

function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function chooseActionForReturn() {
  const actions = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const distances = actions
    .map((action) => {
      const [newX, newY] = getNewPosition(
        agentPosition.x,
        agentPosition.y,
        action
      );
      return {
        action,
        distance: manhattanDistance(newX, newY, 0, 0),
        isValid:
          isValidPosition(newX, newY) &&
          agentMap[newX][newY] !== "P" &&
          agentMap[newX][newY] !== "W",
      };
    })
    .filter((item) => item.isValid);

  distances.sort((a, b) => a.distance - b.distance);
  return distances.length > 0
    ? distances[0].action
    : actions[Math.floor(Math.random() * actions.length)];
}
