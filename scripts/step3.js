// Inicialização das Variáveis Específicas do Jogo
function initGame() {
  gameBoard = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill(null)
  );
  agentMap = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill("?")
  );

  createBoard();
  createMiniMap();
  const initialPositions = generateRandomEnvironment();
  agentPosition = initialPositions.agent;
  placeAgent(agentPosition);
  placeItemAtPosition("home", { x: 0, y: 0 });
  visitsCount = 0;
  hasGold = false;
  hasArrow = true; // Inicialização da flecha
  saveAgentMapToSessionStorage();
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
  const miniMapContainer = document.getElementById("miniMapContainer");
  miniMapContainer.style.display = "block";

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

function updateMiniMap() {
  const miniMapElement = document.getElementById("miniMap");
  if (!miniMapElement) return; // Adicionado para garantir que o miniMap exista
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

function generateRandomEnvironment() {
  const positions = {
    agent: { x: 0, y: 0 },
    gold: generateUniquePosition([]),
    wumpus: null,
    pits: [],
  };

  positions.wumpus = generateUniquePosition([positions.gold]);

  let numberOfPits = Math.floor(boardSize / 2);

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
      if (!gameBoard[newX][newY]) {
        gameBoard[newX][newY] = "breeze";
      } else if (gameBoard[newX][newY] === "smell") {
        gameBoard[newX][newY] = "breeze_smell";
      }
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
      if (!gameBoard[newX][newY]) {
        gameBoard[newX][newY] = "smell";
      } else if (gameBoard[newX][newY] === "breeze") {
        gameBoard[newX][newY] = "breeze_smell";
      }
      const cell = document.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      const smell = document.createElement("div");
      smell.className = "smell";
      cell.appendChild(smell);
    }
  });
}

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
  saveAgentMapToSessionStorage();
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

function makeIntelligentMove() {
  const perceptions = getCurrentPerceptions();
  const action = chooseActionBasedOnPerceptions(perceptions);
  gameStep(action);
}

function getCurrentPerceptions() {
  const { x, y } = agentPosition;
  const perceptions = {
    breeze: gameBoard[x][y] === "breeze",
    smell: gameBoard[x][y] === "smell",
    glitter: gameBoard[x][y] === "gold",
    bump: !isValidPosition(x, y),
  };
  return perceptions;
}

function chooseActionBasedOnPerceptions(perceptions) {
  const currentState = getGameState();
  if (!QTable[currentState]) {
    QTable[currentState] = {};
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(
      (action) => (QTable[currentState][action] = 0)
    );
  }

  const actions = Object.keys(QTable[currentState]);
  const qValues = actions.map((action) => QTable[currentState][action]);
  const maxQValue = Math.max(...qValues);

  if (Math.random() < 0.1) {
    // 10% de chance de explorar uma ação aleatória
    return actions[Math.floor(Math.random() * actions.length)];
  } else {
    // 90% de chance de escolher a melhor ação com base nos valores Q
    return actions[qValues.indexOf(maxQValue)];
  }
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
  if (action === "grab") {
    if (gameBoard[agentPosition.x][agentPosition.y] === "gold") {
      hasGold = true;
      gameBoard[agentPosition.x][agentPosition.y] = null;
      displayMessage("Tesouro encontrado! Voltando para casa...");
    }
  } else if (action === "shoot") {
    // Implementar a lógica para atirar uma flecha
    displayMessage("Você atirou uma flecha!");
  } else {
    const prevState = getGameState();
    moveAgent(action);
    const newState = getGameState();
    const reward = getReward(newState);
    updateQTable(prevState, action, reward, newState);
  }
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
          gameBoard[newX][newY] !== "P" &&
          gameBoard[newX][newY] !== "W",
      };
    })
    .filter((item) => item.isValid);

  distances.sort((a, b) => a.distance - b.distance);
  return distances.length > 0
    ? distances[0].action
    : actions[Math.floor(Math.random() * actions.length)];
}

// Função para salvar o mapa do agente no sessionStorage
function saveAgentMapToSessionStorage() {
  sessionStorage.setItem("agentMap", JSON.stringify(agentMap));
}

// Função para carregar o mapa do agente do sessionStorage
function loadAgentMapFromSessionStorage() {
  const storedAgentMap = sessionStorage.getItem("agentMap");
  if (storedAgentMap) {
    agentMap = JSON.parse(storedAgentMap);
    updateMiniMap();
  }
}

// Chame a função para carregar o mapa do agente quando a página for carregada
document.addEventListener("DOMContentLoaded", loadAgentMapFromSessionStorage);

// Adicione um evento para o botão de reiniciar o jogo
document.getElementById("restartButton").addEventListener("click", () => {
  sessionStorage.clear();
  initGame();
});
