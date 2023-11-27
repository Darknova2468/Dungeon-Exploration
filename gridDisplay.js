/* eslint-disable no-undef */
let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down
const cellTypes = {
  exit: 2,
};
let grid; // = new Array(ySize); // The grid that is displayed
/**
 * Converts an empty array to a uniform 2d array.
 * @param {Array} grid The grid to fill.
 * @param {number} x The number of cells per row.
 * @param {number} toFill The number to fill the cells with.
 */
function generateEmptyGrid(x = xSize, y = ySize, toFill = 0) {
  let emptyGrid = new Array(y);
  for(let i = 0; i < y; i++) {
    emptyGrid[i] = new Array(x).fill(toFill);
  }
  return emptyGrid;
}