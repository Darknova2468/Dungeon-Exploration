let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down

const cellTypes = {
  exit: 2,
};

let grid = new Array(ySize); // The grid that is displayed

/**
 * Converts an empty array to a uniform 2d array.
 * @param {Array} grid The grid to fill.
 * @param {number} x The number of cells per row.
 * @param {number} toFill The number to fill the cells with.
 */
function generateEmptyGrid(grid, x = xSize, toFill = 0) {
  for(let i = 0; i < ySize; i++) {
    grid[i] = new Array(x).fill(toFill);
  }
}

/**
 * Randomizes the grid.
 * @param {Array.<Array.<number>>} grid The grid to randomize.
 */
function randomizeGrid(grid) {
  for(let i = 0; i < grid.length; i++) {
    let row = grid[i];
    for(let j = 0; j < row.length; j++) {
      // eslint-disable-next-line no-undef
      grid[i][j] = random() < fillPortion;
    }
  }
}

function updateDimensions() {
  squareSize = min((height - 2*padding) / ySize, (width - 2*padding) / xSize);
  startX = max(padding, width/2 - squareSize * xSize / 2);
  startY = max(padding, height/2 - squareSize * ySize / 2);
}

/**
 * Displays a grid.
 * @param {Array.<Array.<number>>} grid The grid to display.
 */
function displayGrid(grid) {
  let startTime = millis();
  background(100);
  stroke(0, 50);
  for(let i = 0; i < grid.length; i++) {
    let row = grid[i];
    for(let j = 0; j < row.length; j++) {
      let cell_type = grid[i][j];
      if(0 <= cell_type && cell_type <= 1) {
        fill(255*grid[i][j]);
      }
      else if(cell_type === cellTypes.exit) {
        fill("blue");
      }
      let xCoord = startX + j * squareSize;
      let yCoord = startY + i * squareSize;
      rect(xCoord, yCoord, squareSize, squareSize);
    }
  }
  if(DEBUG) {
    console.log("[Wither Grid] Grid rendering took "
      .concat(((millis() - startTime) / 1000)
      .toString().concat(" seconds.")))
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  squareSize = min((height - 2*padding) / ySize, (width - 2*padding) / xSize);
  startX = max(padding, width/2 - squareSize * xSize / 2);
  startY = max(padding, height/2 - squareSize * ySize / 2);
  displayGrid(grid);
}