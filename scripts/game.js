// game.js

// Inicialização das Variáveis
var visitsCount = 0;
var gameBoard = [];
var agentPosition = { x: 0, y: 0 };
var boardSize = 4;
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;
var QTable = {};
var gameHistory = [];
var gameInterval;
var agentMap = [];
var hasGold = false;

// Configuração de Eventos
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("agentVersion")
    .addEventListener("change", loadAgentScript);
  document.getElementById("startGame").addEventListener("click", startGame);
  document.getElementById("stopGame").addEventListener("click", stopGame);
  document.getElementById("restartGame").addEventListener("click", restartGame);
  document.getElementById("showReport").addEventListener("click", toggleReport);
  document.getElementById("closeModal").addEventListener("click", toggleReport);
  document
    .getElementById("boardSizeSelect")
    .addEventListener("change", changeBoardSize);
  loadAgentScript();
});

function loadAgentScript() {
  const agentVersion = document.getElementById("agentVersion").value;
  const script = document.createElement("script");
  script.src = `./scripts/step${agentVersion}.js`;
  script.onload = () => {
    console.log(`Agente Versão ${agentVersion} carregado.`);
    if (typeof initGame === "function") {
      initGame();
    }
  };
  document.body.appendChild(script);
}

function changeBoardSize(event) {
  boardSize = parseInt(event.target.value);
  if (typeof initGame === "function") {
    initGame();
  }
}

function startGame() {
  stopGame();
  if (typeof initGame === "function") {
    initGame();
  }
  gameInterval = setInterval(makeIntelligentMove, 1000);
}

function stopGame() {
  clearInterval(gameInterval);
}

function restartGame() {
  stopGame();
  if (typeof initGame === "function") {
    initGame();
  }
}

function toggleReport() {
  const reportModal = document.getElementById("reportModal");
  if (reportModal.style.display === "block") {
    reportModal.style.display = "none";
  } else {
    reportModal.style.display = "block";
  }
}
