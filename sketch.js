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

function preload() {
  tileSet = new TileSet("CaveTiles.png", [16, 16]);
}

function setup() {
  createCanvas(600, 300);
  textAlign(CENTER);
  fill(255);
  noStroke();
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3);
  minimap = new MiniMap(30, myDungeon.minimap);
  player = new Player(myDungeon.playerPos, 0, 0, 5, myDungeon.minimap);
  myBackground = tileSet.generateImage(myDungeon.minimap);
}

function draw() {
  background(0);
  image(myBackground, (-player.pos[0]+9.375)*32, (-player.pos[1]+4.75)*32, myBackground.width*2, myBackground.height*2);
  player.move([keyIsDown(68)-keyIsDown(65) ,keyIsDown(83)-keyIsDown(87)], 1/frameRate());
  player.display(player.pos, [width, height], 32);
  let img = minimap.generateImage(player.pos);
  image(img, width-height*5/20, height*1/20, height/5, height/5);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
}