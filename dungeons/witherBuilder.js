/* eslint-disable no-undef */

/**
 * This file is similar to the deleted wither grid display file, built
 * specifically to test new generation features.
 * 
 * The game will not run normally if WITHERMODE is set to true, and a custom
 * main function is used instead for generation.
 */

const WITHERMODE = true;
let WitherLord;

class WitherDisplay {
  constructor() {
    this.padding = 10;
    this.startX = 0;
    this.startY = 0;
    this.squareSize = 0;
  }

  drawGrid(grid) {
    // Update wither display dimensions
    let y = grid.length;
    let x = grid[0].length;
    this.squareSize = min((height - 2*this.padding) / y,
      (width - 2*this.padding) / x);
    this.startX = max(this.padding, width/2 - this.squareSize * x / 2);
    this.startY = max(this.padding, height/2 - this.squareSize * y / 2);

    // Display the grid
    background(100);
    stroke(0, 50);
    for(let i = 0; i < grid.length; i++) {
      let row = grid[i];
      for(let j = 0; j < row.length; j++) {
        let cell_type = grid[i][j];
        if(0 <= cell_type && cell_type <= 1) {
          fill(255*grid[i][j]);
        }
        else if(cell_type === 2) {
          fill(207, 159, 255);
        }
        else {
          fill(200, max(0, 250 - 10 * cell_type), max(0, 200 - 8 * cell_type));
        }
        let xCoord = this.startX + j * this.squareSize;
        let yCoord = this.startY + i * this.squareSize;
        rect(xCoord, yCoord, this.squareSize, this.squareSize);
      }
    }
  }

  update() {}

  handleKeyPress() {
    if(keyCode === 13) {
      this.checkFloor(parseInt(prompt("Enter floor number")));
    }
  }

  checkFloor(floorNum) {
    myDungeon = createDungeonMap(floorNum);
    enterDungeonMap(myDungeon);
    this.drawGrid(myDungeon.minimap);
  }
}