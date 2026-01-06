// ----- Paste your Firebase configuration below -----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com", // Use your actual db url
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ----- End Firebase config -----

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// PONG LOGIC
const canvas = document.getElementById("pong-canvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width, HEIGHT = canvas.height;
const paddleWidth = 14, paddleHeight = 90, paddleSpeed = 7, ballSize = 16, WIN_SCORE = 5;
const AI_DIFFICULTY = 0.68;

let ballX, ballY, ballVX, ballVY;
let leftPaddleY = HEIGHT/2 - paddleHeight/2, rightPaddleY = HEIGHT/2 - paddleHeight/2;
let leftScore = 0, rightScore = 0, leftPaddleDY = 0, isGameOver = false;

let myUsername = null, leaderboardData = [], highScore = 0;
const scoreLeft = document.getElementById("score-left");
const scoreRight = document.getElementById("score-right");
const gameOverDiv = document.getElementById("game-over");
const gameOverMsg = document.getElementById("game-over-message");
const tryAgainBtn = document.getElementById("try-again-btn");
const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");
const leaderboardList = document.getElementById("leaderboard-list");

// Username entry
usernameForm.addEventListener('submit', e => {
  e.preventDefault();
  myUsername = usernameInput.value.trim().replace(/[^\w\s-]/g, '').slice(0, 16);
  usernameModal.classList.remove("show");
  usernameModal.classList.add("hidden");
  startGame();
});

function updateScoreboard() {
  scoreLeft.textContent = leftScore; scoreRight.textContent = rightScore;
}
function clamp(y, min, max) { return Math.max(min, Math.min(max, y)); }
function resetBall(direction = 1) {
  ballX = WIDTH/2 - ballSize/2;
  ballY = HEIGHT/2 - ballSize/2;
  let angle = (Math.random()*Math.PI/2) - Math.PI/4;
  let speed = Math.max(5, 5 + 0.15 * (leftScore + rightScore));
  ballVX = speed * direction * Math.cos(angle);
  ballVY = speed * Math.sin(angle);
}
function drawRect(x, y, w, h, color="#fff") { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function drawBall() { ctx.fillStyle = "#ffe960"; ctx.fillRect(ballX, ballY, ballSize, ballSize); }
function drawNet() {
  ctx.setLineDash([10, 16]);
  ctx.strokeStyle = "#596070AA";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0); ctx.lineTo(WIDTH / 2, HEIGHT); ctx.stroke();
  ctx.setLineDash([]);
}
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawNet();
  drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#32abff");
  drawRect(WIDTH - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#e374ff");
  drawBall();
}
function moveLeftPaddle() { leftPaddleY += leftPaddleDY; leftPaddleY = clamp(leftPaddleY, 0, HEIGHT - paddleHeight); }
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  leftPaddleY = clamp(mouseY - paddleHeight / 2, 0, HEIGHT - paddleHeight);
});
window.addEventListener('keydown', (e) => {
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    leftPaddleDY = e.key === "ArrowDown" ? paddleSpeed : -paddleSpeed;
  }
});
window.addEventListener('keyup', (e) => {
  if (["ArrowUp", "ArrowDown"].includes(e.key)) leftPaddleDY = 0;
});
function aiMoveRightPaddle() {
  if (Math.random() > AI_DIFFICULTY) return;
  let center = rightPaddleY + paddleHeight / 2;
  let target = ballY + ballSize / 2;
  if (Math.abs(center - target) > 10) {
    rightPaddleY += (target > center ? 1 : -1) * (paddleSpeed - 1.4);
  }
  rightPaddleY = clamp(rightPaddleY, 0, HEIGHT - paddleHeight);
}
function updateBall() {
  ballX += ballVX; ballY += ballVY;
  if (ballY <= 0 && ballVY < 0) { ballY = 0; ballVY = -ballVY; }
  if (ballY + ballSize >= HEIGHT && ballVY > 0) { ballY = HEIGHT - ballSize; ballVY = -ballVY; }
  if (ballX <= paddleWidth && ballY + ballSize > leftPaddleY &&
      ballY < leftPaddleY + paddleHeight && ballVX < 0) {
    ballX = paddleWidth;
    let collidePoint = ((ballY + ballSize/2) - (leftPaddleY + paddleHeight/2)) / (paddleHeight/2);
    let angle = collidePoint * (Math.PI/4);
    let speed = Math.abs(ballVX) * 1.07 + 0.1;
    ballVX = speed * Math.cos(angle); ballVY = speed * Math.sin(angle);
    if (ballVX < 3) ballVX = 3;
  }
  if (ballX + ballSize >= WIDTH - paddleWidth && ballY + ballSize > rightPaddleY &&
      ballY < rightPaddleY + paddleHeight && ballVX > 0) {
    ballX = WIDTH - paddleWidth - ballSize;
    let collidePoint = ((ballY + ballSize/2) - (rightPaddleY + paddleHeight/2)) / (paddleHeight/2);
    let angle = collidePoint * (Math.PI/4);
    let speed = Math.abs(ballVX) * 1.07 + 0.1;
    ballVX = -speed * Math.cos(angle); ballVY = speed * Math.sin(angle);
    if (ballVX > -3) ballVX = -3;
  }
  if (ballX + ballSize < 0) { rightScore++; updateScoreboard(); resetBall(-1); }
  if (ballX > WIDTH) { leftScore++; updateScoreboard(); resetBall(1); }
}
function checkGameEnd() {
  if (leftScore >= WIN_SCORE) endGame(true);
  if (rightScore >= WIN_SCORE) endGame(false);
}
function endGame(playerWon) {
  isGameOver = true;
  setTimeout(() => {
    gameOverDiv.classList.remove("hidden");
    gameOverMsg.textContent = playerWon
      ? `🎉 You win! Bot loses! Final Score: ${leftScore} - ${rightScore}`
      : `You lose! Bot wins! Final Score: ${leftScore} - ${rightScore}`;
    tryAgainBtn.focus();
    if (playerWon && leftScore > highScore) { setLeaderboardScore(leftScore); highScore = leftScore; }
  }, 480);
}
function gameLoop() {
  if (!isGameOver) {
    moveLeftPaddle(); aiMoveRightPaddle(); updateBall(); draw(); checkGameEnd();
    requestAnimationFrame(gameLoop);
  }
}
function startGame() {
  leftScore = 0; rightScore = 0; isGameOver = false;
  leftPaddleY = HEIGHT/2 - paddleHeight/2; rightPaddleY = HEIGHT/2 - paddleHeight/2;
  resetBall(1); updateScoreboard();
  gameOverDiv.classList.add("hidden");
  setTimeout(()=>requestAnimationFrame(gameLoop), 150);
}
tryAgainBtn.addEventListener("click", function() { startGame(); });

// ---- Firebase Leaderboard Logic ----
// Save or update score for user
function setLeaderboardScore(score) {
  if (!myUsername) return;
  db.ref("pong_leaderboard/" + myUsername).set({
    name: myUsername,
    score,
    updated: Date.now()
  });
}
function updateLeaderboardView() {
  leaderboardList.innerHTML = "";
  leaderboardData.sort((a,b) => b.score - a.score);
  leaderboardData.forEach((item, idx) => {
    let meClass = (item.name === myUsername) ? "font-weight:bold; color:#ffe960" : "";
    let li = document.createElement("li");
    li.innerHTML = `<span style="${meClass}">${item.name}</span> — <b>${item.score}</b>`;
    leaderboardList.appendChild(li);
  });
}
// Listen for changes in leaderboard
db.ref("pong_leaderboard").on("value", snap => {
  leaderboardData = [];
  if (snap.exists()) {
    snap.forEach(userSnap => {
      let obj = userSnap.val();
      leaderboardData.push(obj);
      if (obj.name === myUsername && obj.score > highScore) highScore = obj.score;
    });
  }
  updateLeaderboardView();
});

window.addEventListener('load', () => {
  usernameInput.value = "";
  usernameModal.classList.remove("hidden");
  usernameModal.classList.add("show");
});
