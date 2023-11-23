/* eslint-disable no-undef */

/**
 * Generates labyrinth edges in a grid.
 * @param {Array.<Array.<number>>} grid The grid to display on.
 * @param {Room} dungeon The dungeon to render.
 */
function generateLabyrinthEdges(grid, dungeon) {
  let outerRooms = getConvexHull(dungeon, (room) => room.pos);
  
}