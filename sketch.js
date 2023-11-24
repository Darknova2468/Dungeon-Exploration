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
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3);
  minimap = new MiniMap(30, myDungeon.minimap);
}

function draw() {
  background(64);
  displayGrid(myDungeon.minimap);
  let img = minimap.generateImage(myDungeon.playerPos);
  image(img, width-height*5/20, height*1/20, height/5, height/5);
}