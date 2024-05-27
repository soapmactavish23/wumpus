const boardSize = 4;
let gameBoard = [];
let agentPosition = { x: 0, y: 0 };

document.addEventListener("keydown", handleKeyPress);

function startGame() {
  gameBoard = Array.from({ length: boardSize }, () =>
    new Array(boardSize).fill(null)
  );
  createBoard();
  placeItem("gold");
  placeItem("wumpus");
  placeMultipleItems("pit", 3);
  placeAgent();
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
}

function placeItem(type) {
  let x, y;
  do {
    x = Math.floor(Math.random() * boardSize);
    y = Math.floor(Math.random() * boardSize);
  } while (gameBoard[x][y] || (x === 0 && y === 0)); // Evita colocar itens na posição inicial do jogador
  gameBoard[x][y] = type;
  const cell = document.querySelector(`[data-x='${x}'][data-y='${y}']`);
  const item = document.createElement("div");
  item.className = type;
  cell.appendChild(item);
  if (type === "pit") {
    placeBreezes(x, y); // Coloca ventos ao redor do poço
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
      gameBoard[newX][newY] = "breeze"; // Marca a célula como tendo uma brisa
      const cell = document.querySelector(
        `[data-x='${newX}'][data-y='${newY}']`
      );
      if (!cell.querySelector(".breeze")) {
        const breeze = document.createElement("div");
        breeze.className = "breeze";
        cell.appendChild(breeze);
      }
    }
  });
}

function handleKeyPress(event) {
  const key = event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
    moveAgent(key);
  }
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
    startGame();
  } else if (cellType === "gold") {
    alert("Você encontrou o ouro! Parabéns!");
    startGame();
  } else if (cellType === "breeze") {
    alert("Buraco próximo");
  }
}

startGame();
