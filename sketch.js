/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;

function setup() {
  createCanvas(windowWidth, windowHeight);
  myDungeon = new DungeonMap(6, 0.2);
}

function draw() {
  background(0);
  displayGrid(myDungeon.minimap);
}