/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let minimap;
let me;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER);
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3);
  minimap = new MiniMap(30, myDungeon.minimap);
  me = new player(myDungeon.playerPos, 0, 0, 5, myDungeon.minimap);
}

function draw() {
  background(64);
  me.move([keyIsDown(68)-keyIsDown(65) ,keyIsDown(83)-keyIsDown(87)], 1/frameRate());
  let img = minimap.generateImage(me.pos);
  image(img, width-height*5/20, height*1/20, height/5, height/5);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
}