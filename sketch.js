/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

function setup() {
  createCanvas(windowWidth, windowHeight);
  updateDimensions();
  // grid = generateEmptyGrid();
  // displayGrid(grid);
  // generateAshenCaveLevel();
  // console.log(generatePrecursorDungeonRoom(5));
  grid = generatePrecursorDungeonRoom(100);
  displayGrid(grid);
}

function draw() {
  // background(220);
}

function keyPressed() {
  if(DEBUG) {
    if(keyCode === ENTER) {
      grid = generatePrecursorDungeonRoom(100);
      displayGrid(grid);
    }
  }
}