/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let minimap;
let player;
let tileSet;
let myBackground;
let playerTileSet;
let slimeTileSet;
let zombieTileSet;

function preload() {
  tileSet = new TileSet("textures/CaveTiles.png", [16, 16]);
  playerTileSet = new AnimateSet("textures/player.png", [19, 21]);
  slimeTileSet = new AnimateSet("textures/slime.png", [19, 21]);
  zombieTileSet = new AnimateSet("textures/zombie.png", [19, 21]);
}

function setup() {
  createCanvas(600, 300);
  textAlign(CENTER);
  fill(255);
  frameRate(30);
  noStroke();
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3, [slimeTileSet, zombieTileSet]);
  minimap = new MiniMap(30, myDungeon.minimap);
  player = new Player(myDungeon.playerPos, myDungeon.minimap, playerTileSet);
  myBackground = new Scene(myDungeon.minimap, [16, 8], tileSet);
}

let gameActive = true;

function draw() {
  if(!gameActive) {
    background(100, 0, 0, 10);
    fill("white");
    textAlign(CENTER, CENTER);
    text("YOU DIED", width/2, height/2);
    return;
  }
  else if(!player.isAlive) {
    background(100, 0, 0, 100);
    fill("white");
    textAlign(CENTER, CENTER);
    text("YOU DIED", width/2, height/2);
    gameActive = false;
    return;
  }
  background(0);
  let dt = 1 / frameRate();
  if(dt > 0.2) {
    dt = 0.2;
  }
  player.move([keyIsDown(68)-keyIsDown(65) ,keyIsDown(83)-keyIsDown(87)], dt, keyIsDown(16));
  myDungeon.move(player, dt);
  image(myBackground.generateScene(player.pos), 0, 0, width, height);
  player.display(player.pos, myBackground.scale, [16, 16]);
  myDungeon.display(player.pos, myBackground.scale, [16, 16]);
  image(minimap.generateImage(player.pos), width-height*5/20, height*1/20, height/5, height/5);
  fill("white");
  textSize(12);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  textSize(20);
  text("Health: " + Math.ceil(player.health), height*3/20, height*3/20);  
}