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
  player = new Player(myDungeon.playerPos, myDungeon.minimap);
  myBackground = new Scene(myDungeon.minimap, [16, 8], tileSet);
}

function draw() {
  background(0);
  //display background
  image(myBackground.generateScene(player.pos), 0, 0, width, height);
  //display entities
  player.move([keyIsDown(68)-keyIsDown(65) ,keyIsDown(83)-keyIsDown(87)], 1/frameRate());
  myDungeon.move(player, 1/frameRate());
  player.display(player.pos, myBackground.scale, [16, 16]);
  myDungeon.display(player.pos, myBackground.scale, [16, 16]);
  // displays minimap
  image(minimap.generateImage(player.pos), width-height*5/20, height*1/20, height/5, height/5);
  fill("white");
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  // updateDimensions(myDungeon.minimap);
  // oldGrid = structuredClone(myDungeon.minimap);
  // generateLabyrinthEdges(myDungeon);
  // displayGrid(myDungeon.minimap)
}