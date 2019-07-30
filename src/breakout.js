////////////////////
// document stuff //
////////////////////

const music = document.getElementById("music");

const topbar = document.getElementById("topbarcanvas");
const ctxTopBar = topbar.getContext("2d");
const canvas = document.getElementById("gamecanvas");
const ctx = canvas.getContext("2d");

const gameOverBanner = document.getElementById("gameover");
const welcomeScreen = document.getElementById("welcome");
const victoryScreen = document.getElementById("victory");

const greenBrickImg = new Image();
greenBrickImg.src = "./img/greenbrick.png";
const blueBrickImg = new Image();
blueBrickImg.src = "./img/bluebrick.png";
const violetBrickImg = new Image();
violetBrickImg.src = "./img/violetbrick.png";
const redBrickImg = new Image();
redBrickImg.src = "./img/redbrick.png";
const ballImg = new Image();
ballImg.src = "./img/ball.png";
const lifeImg = new Image();
lifeImg.src = "./img/life.png";
const paddleImg = new Image();
paddleImg.src = "./img/paddle.png";

let keyRight = false;
let keyLeft = false;

//input
document.addEventListener("keydown", function(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        keyRight = true;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        keyLeft = true;
    }
}, false);
document.addEventListener("keyup", function (e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        keyRight = false;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        keyLeft = false;
    }
}, false);

topbar.addEventListener("mousedown", function(e){
	if((e.offsetX > 167 && e.offsetX < 304) && (e.offsetY > 11 && e.offsetY < 88)){
		newGame();
	}
}, false);

///////////////
// constants //
///////////////

//gamestates
const welcome = 0;
const game = 1;
const gameover = 2;
const victory = 3;
const paused = 4;

const livesStart = 5;

//bricks
const brickWidth = 60;
const brickHeight = 20;
const brickSpace = 10;
const brickRows = 10;
const brickColumns = 7;

//where the wall of bricks are positioned
const wallX = (canvas.width - ((brickWidth + brickSpace) * brickRows - brickSpace))/2;
const wallY = wallX;

//ball
const ballRadius = 10;
const ballSpeed = 3;
const ballStartX = 400;
const ballStartY = 450;

//paddle
const maxPaddleSpeed = 4;
const paddleAccel = 0.8;
const paddleDecel = 0.3;
const paddleWidth = 80;
const paddleHeight = 10;

//timers
const respawnTime = 3000;
const flipTime = 500; //the flickering speed for the respawn effect thing


///////////////
// variables //
///////////////

let gameState = welcome;
let lives;
let score;

let bricks = [];

let ballX;
let ballY;
let ballVelX;
let ballVelY;
let ballVisible;
let respawnTimer;
let flipTimer;

let paddleVel;
let paddleX;

function newGame(){
	music.play();
	welcomeScreen.style.visibility = "hidden";
	gameOverBanner.style.visibility = "hidden";
	victoryScreen.style.visibility = "hidden";
	keyRight = false;
	keyLeft = false;
	lives = livesStart;
	score = 0;
	
	for(let col = 0; col < brickColumns; col++) {
		bricks[col] = [];
		for(let row = 0; row < brickRows; row++) {
			bricks[col][row] = {
				x: wallX + row * (brickWidth + brickSpace), 
				y: wallY + col * (brickHeight + brickSpace), 
				alive: true};
			switch(col){
				case 6:
				case 5:
					bricks[col][row].score = 30;
					bricks[col][row].color = "green"
					break;
				case 4:
				case 3:
					bricks[col][row].score = 60;
					bricks[col][row].color = "blue"
					break;
				case 2:
				case 1:
					bricks[col][row].score = 120;
					bricks[col][row].color = "violet"
					break;
				case 0:
					bricks[col][row].score = 240;
					bricks[col][row].color = "red"
					break;
				default:
					bricks[col][row].score = 30;
					bricks[col][row].color = "green"
			}
		}
	}
	
	ballX = ballStartX;
	ballY = ballStartY;
	ballVelX = (Math.random() < 0.5 ? -1 : 1) * ballSpeed;
	ballVelY = -ballSpeed;
	ballVisible = true;
	respawnTimer = 0;
	flipTimer = 0;
	
	paddleX = (canvas.width - paddleWidth)/2;
	paddleVel = 0;
	
	gameState = game;
}



/////////////
// drawing //
/////////////

function drawBricks(){
	for(let col = 0; col < brickColumns; col++) {
		for(let row = 0; row < brickRows; row++) {
			let brick = bricks[col][row];
			let brickImg;
			if(brick.alive){
				switch(brick.color){
					case "green":
						brickImg = greenBrickImg;
						break;
					case "blue":
						brickImg = blueBrickImg;
						break;
					case "violet":
						brickImg = violetBrickImg;
						break;
					case "red":
						brickImg = redBrickImg;
						break;
					default:
				}
				ctx.drawImage(brickImg, brick.x, brick.y, brickWidth, brickHeight);
			}
		}
	}
}

function drawPaddle(){
	ctx.drawImage(paddleImg, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function drawBall(){
	ctx.drawImage(ballImg, ballX - ballRadius, ballY - ballRadius, ballRadius*2, ballRadius*2)
}

function drawLives(){
	ctxTopBar.clearRect(0, 0, topbar.width/2, topbar.height);
	let startX = 23;
	for(let i = 0; i < lives - 1; i++){
		ctxTopBar.drawImage(lifeImg, startX, 20, ballRadius*2, ballRadius*2);
		startX += 5 + ballRadius * 2;
	}
}

function drawScore(){
	ctxTopBar.clearRect(topbar.width/2, 0, topbar.width/2, topbar.height);
	ctxTopBar.font = "bold 30px Courier";
	ctxTopBar.fillStyle = "#00FF00";
	ctxTopBar.textAlign = "right";
	ctxTopBar.fillText(score, 783, 41); 
}


////////////////////
// game functions //
////////////////////

function movePaddle(){
	//dir is just a direction, so it's -1 or 1
	//i use it to conveniently force a direction change, since multiplying a vel with its dir is always positive
	let velDir = (paddleVel > 0 ? 1 : 0) - (paddleVel < 0 ? 1 : 0);
	let accelDir = (keyRight ? 1 : 0) - (keyLeft ? 1 : 0);
	if(accelDir == 0){
		if(paddleVel * velDir < paddleDecel){
			//ensures paddle decelerates to a stop
			paddleVel = 0;
		}else{
			paddleVel -= paddleDecel * velDir;
		}
	}else{
		let accel = accelDir * paddleAccel;
		//gives you stronger accel if accelerating against your current velocity
		//allows you to change your direction faster, makes the paddle feel better to control
		if(accelDir * velDir < 0){
			accel *= 3;
		}
		if((paddleVel + accel) * velDir > maxPaddleSpeed){
			paddleVel = maxPaddleSpeed * velDir;
		}else{
			paddleVel += accel;
		}
	}
	
	//limits paddle to the edges of the canvas
	if(paddleX + paddleVel < 0){
		paddleX = 0;
		paddleVel = 0;
	}else if(paddleX + paddleVel > canvas.width - paddleWidth){
		paddleX = canvas.width - paddleWidth;
		paddleVel = 0;
	}else{
		paddleX = paddleX + paddleVel;
	}
}

function canvasCollision(){
	if(ballY < ballRadius){ //top boundary of play area
		ballY = ballRadius;
		ballVelY = ballSpeed;
	}	
	if(ballX < ballRadius){ //left boundary of play area
		ballX = ballRadius;
		ballVelX = -ballVelX;
	}
	if(ballX > canvas.width - ballRadius){ //right boundary of play area
		ballX = canvas.width - ballRadius;
		ballVelX = -ballVelX;
	}
	if(ballY > canvas.height + ballRadius){ //bottom boundary of play area-- losing a life
		ballX = ballStartX;
		ballY = ballStartY;
		respawnTimer = respawnTime;
		flipTimer = 500;
		lives--;
		if(lives <= 0){
			gameState = gameover;
		}
	}
}

function paddleCollision(){
	//check for collision in the middle of the paddle
	if(ballY > canvas.height - paddleHeight - ballRadius && ballY < canvas.height - ballRadius&& ballX > paddleX && ballX < paddleX + paddleWidth){ //check against middle of paddle
		ballY = canvas.height - paddleHeight - ballRadius;
		ballVelY = -ballSpeed;
	}
	
	//check for collision on the corners
	let leftCornerDistX = Math.abs(paddleX - ballX);
	let leftCornerDistY = Math.abs(canvas.height - paddleHeight - ballY);
	let leftCornerDist = leftCornerDistX * leftCornerDistX + leftCornerDistY * leftCornerDistY
	if(leftCornerDist < (ballRadius * ballRadius) && ballY < canvas.height - paddleHeight){
		if(leftCornerDistX > leftCornerDistY){
			ballVelX = -ballSpeed;
		}else{
			ballVelY = -ballSpeed;
		}
		let push = (ballRadius * ballRadius) / leftCornerDist;
		let pushX = leftCornerDistX * push;
		let pushY = leftCornerDistY * push;
		ballX = paddleX - pushX;
		ballY = canvas.height - paddleHeight - pushY;
	}
	let rightCornerDistX = Math.abs(ballX - paddleX - paddleWidth);
	let rightCornerDistY = Math.abs(canvas.height - paddleHeight - ballY);
	let rightCornerDist = rightCornerDistX * rightCornerDistX + rightCornerDistY * rightCornerDistY;
	if(rightCornerDist < (ballRadius * ballRadius) && ballY < canvas.height - paddleHeight){
		if(rightCornerDistX > rightCornerDistY){
			ballVelX = ballSpeed;
		}else{
			ballVelY = -ballSpeed;
		}
		let push = (ballRadius * ballRadius) / rightCornerDist;
		let pushX = rightCornerDistX * push;
		let pushY = rightCornerDistY * push;
		ballX = paddleX + paddleWidth + pushX;
		ballY = canvas.height - paddleHeight - pushY;
	}
	
	//check for collision on the sides of the paddle
	if(ballX > paddleX - ballRadius && ballX < paddleX && ballY > canvas.height - paddleHeight){
		ballVelX = -ballSpeed;
	}
	if(ballX < paddleX + paddleWidth + ballRadius && ballX > paddleX + paddleWidth && ballY > canvas.height - paddleHeight){
		ballVelX = ballSpeed;
	}
}

function brickCollision(){
	let unCollided = true;
	for(let col = 0; col < brickColumns; col++) {
		for(let row = 0; row < brickRows; row++) {
			let brick = bricks[col][row];
			if(brick.alive && unCollided){
				if(ballX > brick.x && ballX < brick.x + brickWidth){
					if(ballY > brick.y - ballRadius && ballY < brick.y){
						ballVelY = -ballSpeed;
						brick.alive = false;
						unCollided = false;
						score += brick.score;
					}
					if(ballY < brick.y + brickHeight + ballRadius && ballY > brick.y + brickHeight){
						ballVelY = ballSpeed;
						brick.alive = false;
						unCollided = false;
						score += brick.score;
					}
				}
				if(ballY > brick.y && ballY < brick.y + brickHeight){
					if(ballX > brick.x - ballRadius && ballX < brick.x){
						ballVelX = -ballSpeed;
						brick.alive = false;
						unCollided = false;
						score += brick.score;
					}
					if(ballX < brick.x + brickWidth + ballRadius && ballX > brick.x + brickWidth){
						ballVelX = ballSpeed;
						brick.alive = false;
						unCollided = false;
						score += brick.score;
					}
				}
				let leftDist = Math.abs(ballX - brick.x);
				let rightDist = Math.abs(ballX - (brick.x + brickWidth));
				let topDist = Math.abs(ballY - brick.y);
				let bottomDist = Math.abs(ballY - (brick.y + brickHeight));
				let topLeftCornerDist = leftDist * leftDist + topDist * topDist;
				let topRightCornerDist = rightDist * rightDist + topDist * topDist;
				let bottomLeftCornerDist = leftDist * leftDist + bottomDist * bottomDist;
				let bottomRightCornerDist = rightDist * rightDist + bottomDist * bottomDist;
				if(topLeftCornerDist < (ballRadius * ballRadius) && ballY < brick.y && ballX < brick.x){
					if(leftDist > topDist){
						ballVelX = -ballSpeed;
					}else{
						ballVelY = -ballSpeed;
					}

					brick.alive = false;
					unCollided = false;
					score += brick.score;
				}
				if(topRightCornerDist < (ballRadius * ballRadius) && ballY < brick.y && ballX > brick.x + brickWidth){
					if(rightDist > topDist){
						ballVelX = ballSpeed;
					}else{
						ballVelY = -ballSpeed;
					}
					brick.alive = false;
					unCollided = false;
					score += brick.score;
				}
				if(bottomLeftCornerDist < (ballRadius * ballRadius) && ballY > brick.y + brickHeight && ballX < brick.x){
					if(leftDist > bottomDist){
						ballVelX = -ballSpeed;
					}else{
						ballVelY = ballSpeed;
					}
					brick.alive = false;
					unCollided = false;
					score += brick.score;
				}
				if(bottomRightCornerDist < (ballRadius * ballRadius) && ballY > brick.y + brickHeight && ballX > brick.x + brickWidth){
					if(rightDist > bottomDist){
						ballVelX = ballSpeed;
					}else{
						ballVelY = ballSpeed;
					}	
					brick.alive = false;
					unCollided = false;
					score += brick.score;
				}
			}
		}
	}
}

function respawnTick(){
	flipTimer -= delta;
	respawnTimer -= delta;
	if(respawnTimer < 0){
		//once the ball "respawns", it starts moving
		//it doesn't really die anyway, it just sits in place with no speed
		ballVelX = (Math.random() < 0.5 ? -1 : 1) * ballSpeed;
		ballVelY = -ballSpeed;
		ballVisible = true;
	}else{
		//the flickering respawn effect, controlled by the flipTimer
		if(flipTimer < 0){
			flipTimer = 500;
			ballVisible = !ballVisible;
		}
	}
}

function brickCount(){
	let x = 0;
	for(let col = 0; col < brickColumns; col++) {
		for(let row = 0; row < brickRows; row++) {
			if(bricks[col][row].alive){
				x++;
			}
		}
	}
	return x;
}


////////////////
// game logic //
////////////////

let prevFrameTime = 0;
let FPS = 60;
let tickCount = 0;
let timeStep = 1000/FPS;
let delta = 0;

function gameLoop(timestamp){
	delta = timestamp - prevFrameTime;
	prevFrameTime = timestamp;
	
	//game code
	if(gameState == game){
		movePaddle();
		if(respawnTimer > 0){ //if ball is 'dead'
			respawnTick();
		}else{
			//move ball and go ahead with collision checks if it's 'alive'
			ballX += ballVelX;
			ballY += ballVelY;
			canvasCollision();
			paddleCollision();
			brickCollision();
		}
		if(brickCount() <=0){
			gameState = victory;
		}
	}
	

	//drawing
	if(gameState == game){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawPaddle();
		if(ballVisible){
			drawBall();
		}
		drawBricks();
		drawLives();
		drawScore();
	}
	if(gameState == gameover){
		if(gameOverBanner.style.visibility != "visible"){
			gameOverBanner.style.visibility = "visible";
		}
	}
	if(gameState == victory){
		if(victoryScreen.style.visibility != "visible"){
			victoryScreen.style.visibility = "visible";
		}
	}

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);



