/* eslint-disable no-undef */
function generatePrecursorDungeonRoom(radius) {
  let room = generateEmptyGrid(2*radius + 1, 2*radius + 1);
  generateCaveNode(room, radius, radius, radius * 0.6, radius);
  for(let i = 0; i < 3; i++) {
    room = evaluateNext(room);
  }
  return room;
}