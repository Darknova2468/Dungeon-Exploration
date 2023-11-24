/* eslint-disable no-undef */

function getEffectiveEdgeNode(grid, node) {
  // Get candidate edge nodes
  let x = node[0]; let y = node[1];
  let candidates = [[x, 0], [x, grid.length-1], [0, y], [grid[0].length-1, y]];
  return candidates.reduce((prev, curr) => {
    return dist(prev[0], prev[1], x, y) < dist(curr[0], curr[1], x, y) ? prev : curr;
  });
  // console.log(candidates);
  // console.log(node);
}

function getAdjacentBounds(nodes, adj, i, j) {
  // Note that edge nodes should not be part of this
  pivot = nodes[i];
  let points = adj[i].map((x) => nodes[x[0]]);
  console.log(points);
  points = points.sort(compareAngles);
  return points;
}

/**
 * Generates labyrinth edges in a grid.
 * @param {Room} dungeonMap The dungeon map to operate on.
 */
function generateLabyrinthEdges(dungeonMap) {
  let grid = dungeonMap.minimap;
  let nodes = dungeonMap.dungeon.map((room) => room.pos);
  let n = nodes.length;
  let labyrinthEdges = [];

  // Create two-way adjacency list
  let adj = generateEmptyGrid(0, n);
  for(let i = 0; i < n; i++) {
    for(let connection of dungeonMap.dungeon[i].connections) {
      let j = connection[0];
      let type = connection[2];
      if(type === 2) {
        adj[i].push([j, true]);
        adj[j].push([i, true]);
        labyrinthEdges.push([i, j]);
      }
      else {
        adj[i].push([j, false]);
        adj[j].push([i, false]);
      }
    }
  }

  // Add edges to the wall
  let outerRooms = getConvexHull(nodes, (room) => room);
  for(let j = 0; j < outerRooms.length; j++) {
    let i = outerRooms[j];
    let outerNode = nodes[i];
    nodes.push(getEffectiveEdgeNode(grid, outerNode));
    adj.push([]);
    adj[i].push([j+n, false]);
    adj[j+n].push([i, false]);

    // Debugging
    // let a = getEffectiveEdgeNode(grid, outerNode);
    // grid[a[1]][a[0]] = cellTypes.exit;
  }
  // console.log(labyrinthEdges);

  // Start labyrinth generation
  for(let edge of labyrinthEdges) {
    let ineqs = [];
    console.log(edge[0]);
    console.log(getAdjacentBounds(nodes, adj, edge[0], edge[1]));
  }
}