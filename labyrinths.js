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

function getMidpoint(p1, p2) {
  return [Math.floor((p1[0]+p2[0])/2), Math.floor((p1[1]+p2[1])/2)];
}

function getIndex(l, target, getAttribute = (x) => x) {
  return parseInt(Object.keys(l).find((key) => getAttribute(l[key]) === target));
}

function getAdjacentBounds(nodes, adj, i, j) {
  // Note that edge nodes should not be part of this
  // console.log(adj[i]);
  pivot = nodes[i];
  target = nodes[j];
  let posToIndex = []; let points = [];
  for(let connection of adj[i]) {
    let i = connection[0];
    let pos = nodes[i];
    posToIndex[pos] = i;
    points.push(pos);
  }
  // let a = structuredClone(points);
  points.sort(compareAngles);
  // console.log(a);
  // console.log(points);
  // for(let i = 0; i < points.length; i++) {
  //   displayTextOnGrid(points[i][0], points[i][1], i);
  // }
  // console.log(Object.keys(points).find((i) => nodes[i] === target));
  // Get adjacent edges
  let edgeIndex = getIndex(points, target);
  let lowerEdge = points[(edgeIndex + 1) % points.length];
  let upperEdge = points[(edgeIndex + points.length - 1) % points.length];
  if(adj[i][getIndex(adj[i], posToIndex[lowerEdge], (x) => x[0])][1]) {
    lowerEdge = getMidpoint(lowerEdge, target);
    console.log("Midpoint set!")
  }
  if(adj[i][getIndex(adj[i], posToIndex[upperEdge], (x) => x[0])][1]) {
    upperEdge = getMidpoint(upperEdge, target);
    console.log("Midpoint set!")
  }
  // console.log(`${i} ${j} ${edgeIndex} : ${lowerEdge} ${target} ${upperEdge}`);

  // doneFirstLabyrinth = true;
  return [[pivot, lowerEdge, true], [pivot, upperEdge, false]];
  // return points;
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
    // let ineqs = [];
    // // console.log(edge[0]);
    // ineqs.push(getAdjacentBounds(nodes, adj, edge[0], edge[1]));
    // ineqs.push(getAdjacentBounds(nodes, adj, edge[1], edge[0]));
    let ineqs = getAdjacentBounds(nodes, adj, edge[0], edge[1])
      .concat(getAdjacentBounds(nodes, adj, edge[1], edge[0]));
    let labyGrid = generateEmptyGrid(grid[0].length, grid.length, false);
    for(let y = 0; y < grid.length; y++) {
      for(let x = 0; x < grid[0].length; x++) {
        let satisfies = true;
        for(let bound of ineqs) {
          if(ccw_test(bound[1], bound[0], [x, y]) !== bound[2] && !isCollinear(bound[1], bound[0], [x, y])) {
            satisfies = false;
            break;
          }
        }
        if(satisfies) {
          labyGrid[y][x] = true;
        }
      }
    }

    // Display region (debug only)
    // let labyId = random();
    // for(let y = 0; y < grid.length; y++) {
    //   for(let x = 0; x < grid[0].length; x++) {
    //     if(labyGrid[y][x]) {
    //       grid[y][x] = labyId;
    //     }
    //   }
    // }
    // console.log(ineqs);
  }
}