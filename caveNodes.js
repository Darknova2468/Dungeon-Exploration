const DEBUG = true;

let nodeHardBound = 3;
let nodeSoftBound = 5;

const fillPortion = 0.6; // Portion of solid rock for cave generation

let caveNodes = [];

let caveNodeSeparation = 12;
let numNodes = 25;
let trialLimit = 100;

// /**
//  * Wraps the coordinates of the grid at the edges.
//  * @param {number} a The i-index.
//  * @param {number} b The j-index.
//  * @returns The wrapped coordinates.
//  */
// function wrapIndices(a, b) {
//   a += ySize;
//   a %= ySize;
//   b += xSize;
//   b %= xSize;
//   return [a,b];
// }

function verifyIndices(i, j) {
  return (0 <= i && i < ySize && 0 <= j && j < xSize);
}

function setGrid(grid, i, j, val) {
  if(verifyIndices(i, j)) {
    grid[i][j] = val;
  }
}

/**
 * Gets the number of 1's within a certain radius around a cell in a grid.
 * @param {Array.<Array.<number>>} grid The grid that is checked.
 * @param {number} i The i-index.
 * @param {number} j The j-index.
 * @param {number} r The radius of checking.
 * @returns The number of 1's within the radius.
 */
function getWallsWithin(grid, i, j, r) {
  let acc = 0;
  for(let iDisp = -r; iDisp <= r; iDisp++) {
    for(let jDisp = -r; jDisp <= r; jDisp++) {
      if(iDisp === 0 && jDisp === 0) {
        continue;
      }
      let a = i + iDisp;
      let b = j + jDisp;
      //let newIndices = wrapIndices(a,b);
      if(verifyIndices(a, b)) {
        acc += 1-grid[a][b];
      }
      else {
        acc += 1; // Borders count as a wall
      }
    }
  }
  return acc;
}

/**
 * Evaluates a cave celluar automata into a new grid.
 * @param {Array.<Array.<number>>} newGrid An empty grid.
 * @param {Array.<Array.<number>>} grid The grid that is used for evaluation.
 */
function evaluateCave(newGrid, grid) {
  for(let i = 0; i < grid.length; i++) {
    let row = grid[i];
    for(let j = 0; j < row.length; j++) {
      let alive = row[j];
      if(alive) {
        if(getWallsWithin(grid, i, j, 1) >= 5) {
          newGrid[i][j] = 0;
        }
      }
      else {
        if(getWallsWithin(grid, i, j, 1) >= 3) {
          newGrid[i][j] = 0;
        }
      }
    }
  }
}

/**
 * Returns a grid that has been evaluated by evaluateCave.
 * @param {Array.<Array.<number>>} grid The grid to evaluate.
 * @returns The new grid.
 */
function evaluateNext(grid) {
  let newGrid = new Array(ySize);
  generateEmptyGrid(newGrid, xSize, toFill = 1);
  evaluateCave(newGrid, grid);
  return newGrid;
}


function generateCaveNode(grid, i, j) {
  for(let a = 0; a < ySize; a++) {
    for(let b = 0; b < xSize; b++) {
      if(dist(i, j, a, b) <= nodeHardBound) {
        setGrid(grid, a, b, 1);
      }
      else if(dist(i, j, a, b) <= nodeSoftBound) {
        if(random() < fillPortion) {
          setGrid(grid, a, b, 1);
        }
      }
    }
  }
  // console.log(grid);
}

function attemptCaveNodePlacement(grid) {
  let i = Math.floor(random(ySize));
  let j = Math.floor(random(xSize));
  for(let node of caveNodes) {
    if(dist(i, j, node[0], node[1]) < caveNodeSeparation) {
      return false;
    }
  }
  generateCaveNode(grid, i, j);
  caveNodes.push([i, j]);
  return true;
}

/**
 * Generates a new level.
 */
function generateLevel() {
  // Generate caves
  generateEmptyGrid(grid);
  caveNodes = [];
  numTrials = 0
  while(caveNodes.length < numNodes && numTrials < trialLimit) {
    attemptCaveNodePlacement(grid);
  }
  if(numTrials >= 100) {
    generateLevel();
  }
  // generateCaveNode(grid, 15, 30);
  for(let i = 0; i < 3; i++) {
    grid = evaluateNext(grid);
  }
  displayGrid(grid);

  // Generate maze
  // insertNodes(grid, nodes);
  // generatePerfectMaze();
}

function keyPressed() {
  if(DEBUG) {
    if(keyCode === ENTER) {
      generateLevel();
      // attemptCaveNodePlacement(grid);
      // displayGrid(grid);
    }
  }
}