/* eslint-disable no-undef */
const DEBUG = true;

let caveNodeHardBound = 3;
let caveNodeSoftBound = 5;
let caveEdgeHardBound = 1;
let caveEdgeSoftBound = 6;

const fillPortion = 0.6; // Portion of solid rock for cave generation

let caveNodes = [];

let caveNodeSeparation = 12;
let numNodes = 30;
let trialLimit = 100;

const caveNodePadding = 10;

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

function verifyIndices(grid, i, j) {
  let y = grid.length;
  let x = grid[0].length;
  return 0 <= i && i < y && 0 <= j && j < x;
}

function setGrid(grid, i, j, val) {
  if(verifyIndices(grid, i, j)) {
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
      if(verifyIndices(grid, a, b)) {
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
  let y = grid.length;
  let x = grid[0].length;
  let newGrid = new Array(y);
  newGrid = generateEmptyGrid(x, y, 1);
  evaluateCave(newGrid, grid);
  return newGrid;
}

function generateCaveEdge(grid, i1, j1, i2, j2) {
  let y = grid.length;
  let x = grid[0].length;
  let dj = j2 - j1;
  let di = i2 - i1;
  let c = di * j1 - dj * i1;
  for(let a = 0; a < y; a++) {
    for(let b = 0; b < x; b++) {
      // Check bounds in the parallel direction
      if(i1 * di + j1 * dj < a * di + b * dj && a * di + b * dj < i2 * di + j2 * dj) {
        // Find the distance from the point to the line: dy x + (-dx) y + c = 0
        let d = Math.abs((dj * a - di * b + c) / dist(0, 0, di, dj));
        if(d < caveEdgeHardBound) {
          setGrid(grid, a, b, 1);
        }
        else if(d < caveEdgeSoftBound) {
          if(random() < fillPortion) {
            setGrid(grid, a, b, 1);
          }
        }
      }
    }
  }
}

function generateCaveNode(grid, i, j, hr = caveNodeHardBound, sr = caveNodeSoftBound) {
  let y = grid.length;
  let x = grid[0].length;
  for(let a = 0; a < y; a++) {
    for(let b = 0; b < x; b++) {
      if(dist(i, j, a, b) <= hr) {
        setGrid(grid, a, b, 1);
      }
      else if(dist(i, j, a, b) <= sr) {
        if(random() < fillPortion) {
          setGrid(grid, a, b, 1);
        }
      }
    }
  }
}