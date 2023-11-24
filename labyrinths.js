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
  console.log(adj[i]);
  pivot = nodes[i];
  target = nodes[j];
  let posToIndex = []; let points = [];
  for(let connection of adj[i]) {
    let i = connection[0];
    let pos = nodes[i];
    posToIndex[pos] = i;
    points.push(pos);
  }
  points.sort(compareAngles);
  console.log(points);
  // console.log(Object.keys(points).find((i) => nodes[i] === target));
  let edgeIndex = Object.keys(points).find((key) => points[key] === target);
  edgeIndex = parseInt(edgeIndex);
  let lowerEdge = points[(edgeIndex + 1) % points.length];
  let upperEdge = points[(edgeIndex + points.length - 1) % points.length];
  console.log(`${i} ${j} ${edgeIndex} : ${lowerEdge} ${target} ${upperEdge}`);

  // Get adjacent edges
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
    // console.log(edge[0]);
    let x = getAdjacentBounds(nodes, adj, edge[0], edge[1]);
  }
}