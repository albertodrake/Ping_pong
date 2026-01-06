const canvas = document.getElementById("pong-canvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddle
const paddleWidth = 14, paddleHeight = 90;
const paddleSpeed = 7;

// Ball
const ballSize = 16;
let ballX, ballY, ballVX, ballVY;

// State
let leftPaddleY = HEIGHT/2 - paddleHeight/2;
let rightPaddleY = HEIGHT/2 - paddleHeight/2;
let leftScore = 0, rightScore = 0;

// For keyboard & mouse controls
let leftPaddleDY = 0;

function resetBall(direction = 1) {
  ballX = WIDTH/2 - ballSize/2;
  ballY = HEIGHT/2 - ballSize/2;
  let angle = (Math.random()*Math.PI/2) - Math.PI/4; // Random -45deg..45deg
  let speed = 5;
  ballVX = speed * direction * Math.cos(angle);
  ballVY = speed * Math.sin(angle);
}

function drawRect(x, y, w, h, color="#fff") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawBall() {
  ctx.fillStyle = "#ffe960";
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

function drawNet() {
  ctx.setLineDash([10, 16]);
  ctx.strokeStyle = "#596070AA";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
}

function updateScoreboard() {
  document.getElementById("score-left").textContent = leftScore;
  document.getElementById("score-right").textContent = rightScore;
}

function clamp(y, min, max) {
  return Math.max(min, Math.min(max, y));
}

function moveLeftPaddle() {
  leftPaddleY += leftPaddleDY;
  leftPaddleY = clamp(leftPaddleY, 0, HEIGHT - paddleHeight);
}

// Mouse controls
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  leftPaddleY = clamp(mouseY - paddleHeight / 2, 0, HEIGHT - paddleHeight);
});

// Arrow keys
window.addEventListener('keydown', (e) => {
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    leftPaddleDY = e.key === "ArrowDown" ? paddleSpeed : -paddleSpeed;
  }
});
window.addEventListener('keyup', (e) => {
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    leftPaddleDY = 0;
  }
});

// AI for right paddle
function aiMoveRightPaddle() {
  let target = ballY + ballSize / 2;
  let center = rightPaddleY + paddleHeight / 2;
  if (Math.abs(target - center) > 10) {
    rightPaddleY += (target > center ? 1 : -1) * (paddleSpeed - 2);
  }
  rightPaddleY = clamp(rightPaddleY, 0, HEIGHT - paddleHeight);
}

function updateBall() {
  ballX += ballVX;
  ballY += ballVY;

  // Wall collisions
  if (ballY <= 0 && ballVY < 0) {
    ballY = 0;
    ballVY = -ballVY;
  }
  if (ballY + ballSize >= HEIGHT && ballVY > 0) {
    ballY = HEIGHT - ballSize;
    ballVY = -ballVY;
  }

  // Left paddle collision
  if (
    ballX <= paddleWidth &&
    ballY + ballSize > leftPaddleY &&
    ballY < leftPaddleY + paddleHeight &&
    ballVX < 0
  ) {
    ballX = paddleWidth; // Prevent sticking
    let collidePoint = ((ballY + ballSize/2) - (leftPaddleY + paddleHeight/2)) / (paddleHeight/2);
    let angle = collidePoint * (Math.PI/4);
    let speed = Math.abs(ballVX) * 1.05 + 0.1;
    ballVX = speed * Math.cos(angle);
    ballVY = speed * Math.sin(angle);
    if (ballVX < 3) ballVX = 3;
  }

  // Right paddle collision
  if (
    ballX + ballSize >= WIDTH - paddleWidth &&
    ballY + ballSize > rightPaddleY &&
    ballY < rightPaddleY + paddleHeight &&
    ballVX > 0
  ) {
    ballX = WIDTH - paddleWidth - ballSize;
    let collidePoint = ((ballY + ballSize/2) - (rightPaddleY + paddleHeight/2)) / (paddleHeight/2);
    let angle = collidePoint * (Math.PI/4);
    let speed = Math.abs(ballVX) * 1.05 + 0.1;
    ballVX = -speed * Math.cos(angle);
    ballVY = speed * Math.sin(angle);
    if (ballVX > -3) ballVX = -3;
  }

  // Score
  if (ballX + ballSize < 0) {
    rightScore++;
    updateScoreboard();
    resetBall(-1);
  }
  if (ballX > WIDTH) {
    leftScore++;
    updateScoreboard();
    resetBall(1);
  }
}

function draw() {
  // background
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawNet();

  // paddles
  drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#32abff");
  drawRect(WIDTH - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#e374ff");

  // ball
  drawBall();
}

function gameLoop() {
  moveLeftPaddle();
  aiMoveRightPaddle();
  updateBall();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  resetBall(1);
  updateScoreboard();
  requestAnimationFrame(gameLoop);
}

startGame();
