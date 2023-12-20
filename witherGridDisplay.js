/* eslint-disable no-undef */

// Critical for testing generation if it breaks,
// DO NOT REMOVE

let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down

const cellTypes = {
  edge: 1,
  laby: 2,
};

let grid; // = new Array(ySize); // The grid that is displayed

// /**
//  * Converts an empty array to a uniform 2d array.
//  * @param {Array} grid The grid to fill.
//  * @param {number} x The number of cells per row.
//  * @param {number} toFill The number to fill the cells with.
//  */
// function generateEmptyGrid(x = xSize, y = ySize, toFill = 0) {
//   let emptyGrid = new Array(y);
//   for(let i = 0; i < y; i++) {
//     emptyGrid[i] = new Array(x).fill(toFill);
//   }
//   return emptyGrid;
// }

/**
 * Randomizes the grid.
 * @param {Array.<Array.<number>>} grid The grid to randomize.
 */
function randomizeGrid(grid) {
  for(let i = 0; i < grid.length; i++) {
    let row = grid[i];
    for(let j = 0; j < row.length; j++) {
      grid[i][j] = random() < fillPortion;
    }
  }
}

function updateDimensions(y = ySize, x = xSize) {
  squareSize = min((height - 2*padding) / y, (width - 2*padding) / x);
  startX = max(padding, width/2 - squareSize * x / 2);
  startY = max(padding, height/2 - squareSize * y / 2);
}

/**
 * Displays a grid.
 * @param {Array.<Array.<number>>} grid The grid to display.
 */
function displayGrid(grid) {
  let startTime = millis();
  updateDimensions(grid.length, grid[0].length);
  background(100);
  stroke(0, 50);
  for(let i = 0; i < grid.length; i++) {
    let row = grid[i];
    for(let j = 0; j < row.length; j++) {
      let cell_type = grid[i][j];
      if(cell_type === 0) {
        fill(0);
      }
      else if(cell_type === cellTypes.edge) {
        fill("green");
      }
      else if(cell_type === cellTypes.laby) {
        fill("blue");
      }
      else {
        fill(255, 255 - 10 * (cell_type - 3), 255 - 10 * (cell_type - 3));
      }
      let xCoord = startX + j * squareSize;
      let yCoord = startY + i * squareSize;
      rect(xCoord, yCoord, squareSize, squareSize);
    }
  }
  if(DEBUG) {
    console.log("[Wither Grid] Grid rendering took "
      .concat(((millis() - startTime) / 1000)
        .toString().concat(" seconds.")));
  }
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   squareSize = min((height - 2*padding) / ySize, (width - 2*padding) / xSize);
//   startX = max(padding, width/2 - squareSize * xSize / 2);
//   startY = max(padding, height/2 - squareSize * ySize / 2);
//   displayGrid(grid);
// }

// function keyPressed() {
//   if(keyCode === 13) {
//     displayGrid(myDungeon.minimap);
//   }
//   else if(keyCode === 88) {
//     displayGrid(oldGrid);
//   }
// }