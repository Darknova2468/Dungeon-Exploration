/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let minimap;

function setup() {
  createCanvas(400, 400);
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3);
  minimap = new MiniMap(30, myDungeon.minimap);
}

function draw() {
  background(64);
  let img = minimap.generateImage(myDungeon.playerPos);
  image(img, width*15/20, height*1/20, width/5, height/5);
}