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
  minimap = new MiniMap(20);
}

function draw() {
  background(0);
  displayGrid(minimap.raster);
}