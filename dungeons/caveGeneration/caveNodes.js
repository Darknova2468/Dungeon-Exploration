/* eslint-disable no-extra-parens */
/* eslint-disable no-undef */
const DEBUG = false;

let caveNodeHardBound = 2;
let caveNodeSoftBound = 4;
let caveEdgeHardBound = 2;
let caveEdgeSoftBound = -1; // No soft bound

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
 * @returns The number of 0's within the radius.
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
        acc += (grid[a][b] === 0);
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
  // console.log(newGrid[3][3]);
}

/**
 * Returns a grid that has been evaluated by evaluateCave.
 * @param {Array.<Array.<number>>} grid The grid to evaluate.
 * @returns The new grid.
 */
function evaluateNext(grid, toFill = 1) {
  let y = grid.length;
  let x = grid[0].length;
  let newGrid = new Array(y);
  newGrid = generateEmptyGrid(x, y, toFill);
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

function floodFillExclude(grid, i, j, toFill = 1) {
  let newGrid = generateEmptyGrid(grid[0].length, grid.length);
  let stack = [[i, j]];
  while(stack.length > 0) {
    let [i, j] = stack.pop();
    for(let iDisp of [-1, 0, 1]) {
      for(let jDisp of [-1, 0, 1]) {
        if((iDisp === 0) ^ (jDisp !== 0)) {
          continue;
        }
        let newI = i + iDisp;
        let newJ = j + jDisp;
        if(verifyIndices(grid, newI, newJ) && grid[newI][newJ] === toFill
          && newGrid[newI][newJ] === 0) {
          stack.push([newI, newJ]);
          newGrid[newI][newJ] = toFill;
        }
      }
    }
  }
  updateDimensions(grid.size, grid[0].size);
  // displayGrid(newGrid);
  return newGrid;
}

function generateCaveNode(grid, i, j, hr = caveNodeHardBound, sr = caveNodeSoftBound, toFill) {
  let y = grid.length;
  let x = grid[0].length;

  // TEMPORARY
  // sr = 0;
  for(let a = 0; a < y; a++) {
    for(let b = 0; b < x; b++) {
      if(dist(i, j, a, b) <= hr) {
        setGrid(grid, a, b, toFill);
      }
      else if(dist(i, j, a, b) <= sr) {
        if(random() < fillPortion) {
          setGrid(grid, a, b, toFill);
        }
      }
    }
  }
  for(let i = 0; i < 3; i++) {
    grid = evaluateNext(grid, toFill);
  }
  // let newGrid = floodFillExclude(grid, i, j);
  // for(let a = 0; a < y; a++) {
  //   for(let b = 0; b < x; b++) {
  //     if(verifyIndices(grid, a, b)) {
  //       setGrid(grid, a, b, newGrid[a][b]);
  //     }
  //   }
  // }
  grid = floodFillExclude(grid, i, j, toFill);
  // setGrid(grid, i, j, 3);
  return grid;
}