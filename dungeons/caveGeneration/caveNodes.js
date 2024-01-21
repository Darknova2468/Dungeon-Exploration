/* eslint-disable no-extra-parens */
/* eslint-disable no-undef */

/**
 * This file handles the cave node and cave edge generation for the dungeon
 *   generation, as well as providing auxillary functions such as
 *   verifyIndices, setGrid, getWallsWithin, and flood fill algorithms.
 * Cave node generation works by creating two concentric circles. The region
 *   inside the smaller circle is completely hollowed out, while the region
 *   between the two concentric circles is randomly filled. Then, celluar
 *   automata smoothens the edges of the cave node to produce a more natural
 *   look, and flood fill removes the disconnected regions produced as
 *   artifacts of the algorithm. Finally, the room is rasterized into the
 *   dungeon.
 * Cave edge generation is more simple. The bounds are checked using a linear
 *   algebra algorithm to create a rectangle in the direction of the desired
 *   cave edge region. Then, the region is filled.
 * There are also a few auxillary functions within the file that are used in
 *   many places. These include:
 *  - verifyIndices: ensures that given indices fall in the range of a grid
 *  - setGrid: sets a cell in the grid after calling verifyIndices
 *  - getWallsWithin: Gets the number of walls within a certain radius
 */

// General debug variable
const DEBUG = false;

// Default variables for cave node radius and cave edge width specifications
let caveNodeHardBound = 2;
let caveNodeSoftBound = 4;
let caveEdgeHardBound = 2;
let caveEdgeSoftBound = -1; // No soft bound

const FILLPORTION = 0.6; // Portion of solid rock for cave generation
const NUMGENERATIONS = 3;

/**
 * Ensures that given indices fall in the range of a two-dimensional grid.
 * @param {Array.<Array.<any>>} grid The grid in concern.
 * @param {number} i The i-index.
 * @param {number} j The j-index.
 * @returns Whether the indices are within range.
 */
function verifyIndices(grid, i, j) {
  let y = grid.length;
  let x = grid[0].length;
  return 0 <= i && i < y && 0 <= j && j < x;
}

/**
 * Sets the grid at the given indices if possible.
 * @param {Array.<Array.<any>>} grid The grid in concern.
 * @param {number} i The i-index.
 * @param {number} j The j-index.
 * @param {any} val The value to set.
 */
function setGrid(grid, i, j, val) {
  if(verifyIndices(grid, i, j)) {
    grid[i][j] = val;
  }
}

/**
 * Gets the number of 0's within a certain radius around a cell in a grid.
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
          newGrid[i][j] = 0; // Maintains a wall if many neighbours were walls
        }
      }
      else {
        if(getWallsWithin(grid, i, j, 1) >= 3) {
          newGrid[i][j] = 0; // Becomes a wall if a few neighbours were walls
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
function evaluateNext(grid, toFill = 1) {
  let y = grid.length;
  let x = grid[0].length;
  let newGrid = new Array(y);
  newGrid = generateEmptyGrid(x, y, toFill); // New grid has no walls yet
  evaluateCave(newGrid, grid); // Fills in the walls
  return newGrid;
}

/**
 * Creates a cave edge from one point to another.
 * @param {Array.<Array.<number>>} grid The dungeon map to draw on.
 * @param {number} i1 The starting i-index.
 * @param {number} j1 The starting j-index.
 * @param {number} i2 The ending i-index.
 * @param {number} j2 The ending j-index.
 */
function generateCaveEdge(grid, i1, j1, i2, j2) {
  let y = grid.length;
  let x = grid[0].length;

  // The linear algebra part
  let dj = j2 - j1;
  let di = i2 - i1;
  let c = di * j1 - dj * i1;
  for(let a = 0; a < y; a++) {
    for(let b = 0; b < x; b++) {
      // Check bounds in the parallel direction
      if(i1 * di + j1 * dj < a * di + b * dj
          && a * di + b * dj < i2 * di + j2 * dj) {
        // Find the distance from the point to the line: dy x + (-dx) y + c = 0
        let d = Math.abs((dj * a - di * b + c) / dist(0, 0, di, dj));
        if(d < caveEdgeHardBound) {
          setGrid(grid, a, b, 1);
        }
        else if(d < caveEdgeSoftBound) {
          if(random() < FILLPORTION) {
            setGrid(grid, a, b, 1);
          }
        }
      }
    }
  }
}

/**
 * Creates a new grid identical to a given one that does not contain parts
 *   unreachable from a certain starting position in the grid.
 * @param {grid} grid The grid to check.
 * @param {number} i The i-index of the starting point.
 * @param {number} j The j-index of the starting point.
 * @param {number} toFill The zone identity to flood fill with.
 * @returns A new identical grid, excluding regions not reached by the flood
 *   fill.
 */
function floodFillExclude(grid, i, j, toFill = 1) {
  let newGrid = generateEmptyGrid(grid[0].length, grid.length);
  let stack = [[i, j]]; // Stack to keep track of unvisited cells
  while(stack.length > 0) {
    let [i, j] = stack.pop();
    for(let iDisp of [-1, 0, 1]) {
      for(let jDisp of [-1, 0, 1]) {
        // Ensure that directions are cardinal
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
  return newGrid;
}

/**
 * Generates a cave node.
 * @param {Array.<Array.<number>>} grid The grid to draw on.
 * @param {number} i The i-index of the centre.
 * @param {number} j The j-index of the centre.
 * @param {number} hr The hard radius of the inner circle without walls.
 * @param {number} sr The soft radius of the outer circle randomly filled.
 * @param {number} toFill The zone identity to fill the grid with.
 * @returns The grid that was drawn on.
 */
function generateCaveNode(grid, i, j,
    hr = caveNodeHardBound, sr = caveNodeSoftBound, toFill) {
  let y = grid.length;
  let x = grid[0].length;
  
  // Concentric circle algorithm described above
  for(let a = 0; a < y; a++) {
    for(let b = 0; b < x; b++) {
      if(dist(i, j, a, b) <= hr) {
        setGrid(grid, a, b, toFill);
      }
      else if(dist(i, j, a, b) <= sr) {
        if(random() < FILLPORTION) {
          setGrid(grid, a, b, toFill);
        }
      }
    }
  }

  // Runs celluar automata
  for(let i = 0; i < NUMGENERATIONS; i++) {
    grid = evaluateNext(grid, toFill);
  }
  grid = floodFillExclude(grid, i, j, toFill);
  return grid;
}