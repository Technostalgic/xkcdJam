///
///	code by Isaiah Smith
///		
///	https://technostalgic.itch.io  
///	twitter @technostalgicGM
///

/* game.js
	the main entry point for the game, interlaces all data structures and 
	initializes the game loop where all game logic is processed, also contains
	some global general all-purpose functions for making my life easier
*/

// prevents arrow key / space scrolling on the web page
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var effectCanvas = document.createElement("canvas");
var effectContext = effectCanvas.getContext("2d");
	effectCanvas.width = canvas.width;
	effectCanvas.height = canvas.height;
	
var debugDraw = false;
var gameStalled = false;

var timeElapsed = 0; //represents the total time elapsed since the page loaded
var gameStart = 0; //represents the start of the current round in milliseconds elapsed since page load
var dt = 0; //the amount of time between frames
var odt = 0; //the overlap of dt, when too much accumulates, the game is updated multiple times per tick to match real world time

var mode = 0;
var dir = { //direction enumerator
	up: -Math.PI / 2,
	down: Math.PI / 2,
	right: 0,
	left: Math.PI
};
var lanes = [200, 240, 280, 320, 360, 400];
var activeCars = 0;

var saveKey = "technostalgic_xkcd_highschore"; //used to store highscore data in the browser's local data cache
var score = 0;
var hiscore = 0;
var player1;
var vehicles = [];
var effects = [];
var controls = [37, 39, 38, 40, 88, 67, 32]; //the control scheme in keyCodes
var gfx = {};

function clearScreen(ctx){
	/* function clearScreen(ctx)
		clears the canvas to a plain white
		params: 
			ctx:canvasRenderingContext2D - the context to render with
	*/
	ctx.fillStyle = "#fff"; //opaque white
	ctx.fillRect(0, 0, canvas.width, canvas.height); //a rectangle the size of the screen
}

function hook_controls(){
	document.addEventListener('keydown', handleControlsDown); //handleControlsDown(e) is now called whenever a key press is detected
}
function handleControlsDown(event){
	/* function handleControlsDown(event)
		updates the game data to inform that a control is being triggered
	*/
	//console.log(event.key + ":" + event.keyCode); //used for debugging
	
	switch(event.keyCode){
		case controls[0]: control_Left(); break;
		case controls[1]: control_Right(); break;
		case controls[2]: control_Up(); break;
		case controls[3]: control_Down(); break;
		case 32: control_select(); break; //spacebar
		case 220: gameStalled = !gameStalled; break; //fw slash
	}
}
function control_Left(){
	switch(mode){
		case 1: inGame_Left(); break;
	}
}
function control_Right(){
	switch(mode){
		case 1: inGame_Right(); break;
	}
}
function control_Up(){
	switch(mode){
		case 1: inGame_Up(); break;
		default: menu_Up(); break;
	}
}
function control_Down(){
	switch(mode){
		case 1: inGame_Down(); break;
		default: menu_Down(); break;
	}
}
function control_select(){
	switch(mode){
		case 0: startGame(); break;
		case 1: /*pause*/ break;
		case 2: startGame(); break;
	}
}

function inGame_Left(){
	player1.move(dir.left);
}
function inGame_Right(){
	player1.move(dir.right);
}
function inGame_Up(){
	player1.move(dir.up);
}
function inGame_Down(){
	player1.move(dir.down);
}
function menu_Up(){
	
}
function menu_Down(){
	
}

function elapsedGameTime(){
	/* function elapsedGameTime()
		returns the amount of time in milliseconds that the round has been going on for
		value:Number
	*/
	return timeElapsed - gameStart;
}

function init(){
	/* function init()
		initializes all the game data when the page is loaded
	*/
	loadGFX();
	loadHighScore();
	player1 = new player();
	vehicles = [];
	effects = [];
	mode = 0;
	hook_controls();
	requestAnimationFrame(step); //starts the game loop
}
function step(){
	/* function step()
		main logic loop entry point
	*/
	if(gameStalled){
		requestAnimationFrame(step); // sets the next step to be called recursively
		dt = Math.max(0, performance.now() - timeElapsed); //measures the time between the last step and this step
		timeElapsed = performance.now();
		return;
	}
	
	//updates the game loop while trying to match real 
	//world time as close as possibles
	odt += dt;
	while(odt >= 16.66667){
		update();
		odt -= 16.66667;
	}
	draw(context); //renders everything at the end of each tick
	
	requestAnimationFrame(step); // sets the next step to be called recursively
	dt = Math.max(0, performance.now() - timeElapsed); //measures the time between the last step and this step
	timeElapsed = performance.now();
}
function update(){
	/* function update()
		main logic entry point for the game loop
	*/
	if(mode != 1){ //if not in the middle of a round
		menuUpdate();
		return;
	}
	updateGame();
}
function draw(ctx){
	/* function draw(ctx)
		renders everything on screen
	*/
	clearScreen(ctx);
	if(mode != 1){ //draw menus if need be
		if(mode == 2) drawEndScreen(ctx);
		else drawStartScreen(ctx);
		return;
	}
	drawGame(ctx);
	
	if(debugDraw) draw_debug();
}
function draw_debug(){
	for(var i = vehicles.length - 1; i >= 0; i--)
		vehicles[i].draw_debug();
	player1.draw_debug();
}

function loadGFX(){
	gfx.strtscr_deskGuy = new Image();
	gfx.strtscr_deskGuy.src = "./gfx/deskGuy.gif";
	gfx.strtscr_controlKeys = new Image();
	gfx.strtscr_controlKeys.src = "./gfx/controlKeys.gif";
	
	gfx.gameBG = new Image();
	gfx.gameBG.src = "./gfx/gameBG.gif";
}

function spawnVehicles(){
	var maxVehicles = 10;
	if(activeCars < maxVehicles)
		spawnVehicle();
}
function spawnVehicle(){
	var veh = new car();
	
	if(!veh.isOverlappingVehicle() && veh.getPotentialCollisions() <= 0){
		activeCars += 1;
		vehicles.push(veh);
	}
}
function updateVehicles(){
	for(var i = vehicles.length - 1; i >= 0; i--)
		vehicles[i].update();
}
function drawVehicles(ctx){
	for(var i = vehicles.length - 1; i >= 0; i--)
		vehicles[i].draw(ctx);
}

function updateEffects(){
	for(var i = effects.length - 1; i >= 0; i--)
		effects[i].update();
}
function drawEffects(ctx){
	ctx.drawImage(effectCanvas, 0, 0);
	for(var i = effects.length - 1; i >= 0; i--)
		effects[i].draw(ctx);
}

function updateGame(){
	/* function updateGame()
		handles update logic for the game when a round is in session
	*/
	player1.update();
	
	updateVehicles();
	spawnVehicles();
	updateEffects();
}
function drawGame(ctx){
	/* drawGame(ctx)
		handles rendering when a round is in session
		parameters:
			ctx:canvasRenderingContext2D - context to render with
	*/
	ctx.drawImage(gfx.gameBG, 0, 0);
	
	drawEffects(ctx);
	player1.draw(ctx);
	drawVehicles(ctx);
}

function menuUpdate(){
	/* function menuUpdate()
		logic step for menu mode
	*/
}

function drawStartScreen(ctx){
	/* drawStartScreen(ctx)
		renders the start screen
		parameters:
			ctx:canvasRenderingContext2D - context to render with
	*/
	ctx.textAlign = "center";
	
	ctx.fillStyle = "#111";
	ctx.font = "14px xkcdFont";
	ctx.fillText("Comic #772", canvas.width / 2, 50);
	
	ctx.fillStyle = "#000";
	ctx.font = "36px xkcdFont";
	ctx.fillText('" Frogger "', canvas.width / 2, 100);
	
	ctx.fillStyle = "#888";
	ctx.font = "10px xkcdScript";
	ctx.fillText("( slightly more realistic )", canvas.width / 2, 120);
	ctx.fillStyle = "#AAA";
	ctx.font = "8px xkcdScript";
	ctx.fillText("( only slightly though )", canvas.width / 2, 130);
	
	ctx.drawImage(gfx.strtscr_deskGuy, 
		canvas.width / 3 - gfx.strtscr_deskGuy.width / 2, 
		canvas.height / 2 - gfx.strtscr_deskGuy.height / 2);
	ctx.drawImage(gfx.strtscr_controlKeys, 
		canvas.width * (2 / 3) - gfx.strtscr_controlKeys.width / 2, 
		canvas.height / 2 - gfx.strtscr_controlKeys.height / 2);
	ctx.fillStyle = "#000";
	ctx.font = "16px xkcdScript";
	ctx.fillText("Movement", canvas.width / 2 + 25, canvas.height / 2 + 100);
	
	var blinkInterval = 1200;
	ctx.fillStyle = timeElapsed % blinkInterval < blinkInterval / 2 ? "#000" : "#EEE";
	ctx.font = "28px xkcdScript";
	ctx.fillText("Press 'spacebar' to start", canvas.width / 2, canvas.height - 50);
}
function drawEndScreen(ctx){
	/* function drawEndScreen(ctx)
		renders the screen that appears when you die
		params:
			ctx:canvasRenderingContext2D - context to render with
	*/
}

function startGame(){
	/* function startGame()
		begins a new round of the game and reinitializes all the game 
		variables
	*/
	mode = 1;
	gameStart = timeElapsed;
	score = 0;
	player1 = new player();
	activeCars = 0;
	vehicles = [];
	effects = [];
	effectContext.clearRect(0, 0, effectCanvas.width, effectCanvas.height);
}
function endGame(){
	/* function endGame()
		ends the current round
	*/
	mode = 2;
	saveHighScore();
}
function addScore(pts){
	/* function addScore()
		gives a specified amount of points to the player1
		parameters: 
			pts:Number - how many points to give the player1
	*/
	score += pts;
}

function loadHighScore(){
	/* function loadHighScore()
		loads the high score from the browser local storage if possible
	*/
	
	// attempts to read the savekey from the browser's local storage
	try{
		var hi = localStorage.getItem(saveKey)
		if(hi == null){
			hiscore = 0;
			return;
		}
		hiscore = Number.parseInt(hi);
	}
	catch(err){ // most likely reason for failure is because site storage is disabled in the browser's settings, so I just assume that's the exception that's thrown
		alert("Warning: You have site storage disabled!\nYou can still play the game, but your high scores will not be saved.");
		hiscore = 0;
		return;
	}
}
function saveHighScore(){
	/* function saveHighScore()
		saves the highscore to the browser's local storage if possible
	*/
	
	// sets the session highscore to the last round's score if it beat the previous
	// high score
	hiscore = Math.max(score, hiscore);
	
	// attempts to save the high score to the browser's local storage
	try{
		localStorage.setItem(saveKey, hiscore);
	}
	catch(err){} // if failure, don't worry about it.
}

function playSound(snd, startover = true){
	/* function playSound(snd, startover)
		called whenever a sound is played
		parameters:
			snd:Audio - the sound effect to play
			startover:Boolean - if false AND this instance is already in the middle
				of playing, the sound will continue to play as normal instead of 
				restarting
	*/
	if(startover)
		snd.currentTime = 0;
	snd.play();
}

function DEBUGSTART(){
	/* function DEBUGSTART()
		starts the game with debug things (should only be called in debug build)
	*/
	
}

// life easier
function rand(min = 0, max = 1){
	/* function rand(min, max)
		returns a random number between min and max
	*/
	return (Math.random() * (max - min) + min);
}
function mod(div, max){
	/* function mod(div, max)
		returns the unsigned modulus
		parameters:
			div:Number - the dividend
			max:Number - the divisor
	*/
	if(div > 0)
		return div % max;
	return div % max + max;
}
function angDist(source, target){
	/* function angDist(source, target)
		returns the signed difference between two angles
		parameters:
			source:Number - the angle in radians
			target:Number - the comparitive angle in radians
	*/
	var dif = target - source;
	dif = mod(dif + Math.PI, Math.PI * 2) - Math.PI;
	return dif;
}
function drawImage(ctx, img, pos, ang = 0, sprite = null){
	var width =  img.width;
	var height = img.height;
	if(sprite){
		width = sprite.size.x;
		height = sprite.size.y;
	}
	
	ctx.translate(pos.x, pos.y);
	ctx.rotate(ang);
	
	ctx.drawImage(
		img,
		sprite.left(), sprite.top(),
		width, height,
		width / -2, height / -2, //pos.x - width / 2, pos.y - height / 2,
		width, height 
		);
		
	ctx.rotate(-ang);
	ctx.translate(-pos.x, -pos.y);
}

// initializes the game
init();