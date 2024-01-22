/* eslint-disable no-extra-parens */
/* eslint-disable no-undef */
// Eslint disabled for those because names are already defined in other files
// and the parantheses are necessary

/**
 * Here, we generate the labyrinths. The many auxillary functions are needed to
 *   ensure that multiple bounds are met. The core of the labyrinth generation
 *   is Prim's algorithm, in the function runPrim. More details can be found in
 *   reflection_Robert.md.
 */

/**
 * Finds the closest point on the edge of a given dungeon map to a cave node.
 *   This will act as an effective boundary for the labyrinth.
 * @param {Array.<Array.<number>>} grid The dungeon map grid.
 * @param {Array.<number>} node The position vector of the cave node.
 * @returns The closest point on an edge of the map.
 */
function getEffectiveEdgeNode(grid, node) {
  // Get candidate edge nodes
  let x = node[0]; let y = node[1];
  let candidates = [[x, 0], [x, grid.length-1], [0, y], [grid[0].length-1, y]];
  return candidates.reduce((prev, curr) => {
    return dist(prev[0], prev[1], x, y)
      < dist(curr[0], curr[1], x, y) ? prev : curr;
  });
}

/**
 * Gets the midpoint of two given vectors
 */
function getMidpoint(p1, p2) {
  return [Math.floor((p1[0]+p2[0])/2), Math.floor((p1[1]+p2[1])/2)];
}

/**
 * Finds the index of an array givne the object.
 * @param {Array.<any>} l The list to search.
 * @param {any} target The target value.
 * @param {function} getAttribute Required attribute getter.
 * @returns The index.
 */
function getIndex(l, target, getAttribute = (x) => x) {
  return parseInt(Object.keys(l)
    .find((key) => getAttribute(l[key]) === target));
}

/**
 * Bounds a labyrinth edge by the adjacent edges of the source node, or the
 *   median if the adjacent edge is also a labyrinth edge.
 * @param {Array.<Array.<number>>} nodes The position of each labyrinth node.
 * @param {Array.<Array.<Array<number, boolean>>>} adj The adjacency list of
 *   the nodes.
 * @param {number} i The first room of a labyrinth edge.
 * @param {number} j The second room of a labyrinth edge.
 * @returns The bounds given by the first room and its adjacent edges.
 */
function getAdjacentBounds(nodes, adj, i, j) {
  // Note that edge nodes should not be part of this
  pivot = nodes[i]; // Defined in convexHull
  let target = nodes[j];
  let posToIndex = []; let points = [];
  for(let connection of adj[i]) {
    let i = connection[0];
    let pos = nodes[i];
    posToIndex[pos] = i;
    points.push(pos);
  }
  points.sort(compareAngles);
  let edgeIndex = getIndex(points, target);
  let lowerEdge = points[(edgeIndex + 1) % points.length];
  let upperEdge = points[(edgeIndex + points.length - 1) % points.length];
  if(adj[i][getIndex(adj[i], posToIndex[lowerEdge], (x) => x[0])][1]) {
    lowerEdge = getMidpoint(lowerEdge, target);
  }
  if(adj[i][getIndex(adj[i], posToIndex[upperEdge], (x) => x[0])][1]) {
    upperEdge = getMidpoint(upperEdge, target);
  }
  return [[pivot, lowerEdge, true], [pivot, upperEdge, false]];
}

/**
 * Creates a list of random edge weights connecting every pair of adjacent
 *   nodes.
 * @param {Array.<Array.<number>>} nodes The position of each labyrinth node.
 * @param {number} i The first room of a labyrinth edge.
 * @param {number} j The second room of a labyrinth edge.
 * @returns The random edges.
 */
function getEdges(nodes, i, j) {
  let l = [];
  for(let iDisp of [-1, 0, 1]) {
    for(let jDisp of [-1, 0, 1]) {
      // Verify orthognal directionality
      if((iDisp === 0) ^ (jDisp !== 0)) {
        continue;
      }
      let newI = i + iDisp;
      let newJ = j + jDisp;
      if(verifyIndices(nodes, newI, newJ) && nodes[newI][newJ] === 1) {
        // Push a random edge
        l.push([random(), [i, j], [newI, newJ]]);
      }
    }
  }
  return l;
}

/**
 * Given a point in a grid, check if the orthogonal spaces around it are filled
 */
function checkOrthogonalAdjacents(grid, i, j, iNode = 0, jNode = 0) {
  for(let iDisp of [-1, 0, 1]) {
    for(let jDisp of [-1, 0, 1]) {
      // Verify orthognal directionality
      if((iDisp !== 0) && (jDisp !== 0)) {
        continue;
      }
      // Check dot product (edge condition only)
      if(Math.abs(iDisp * iNode + jDisp * jNode) > 1e-8) {
        continue;
      }
      let newI = i + iDisp;
      let newJ = j + jDisp;
      if(verifyIndices(grid, newI, newJ) && grid[newI][newJ] > 0) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates a single labyrinth edge by using Prim's algorithm to fill in the
 *   labyrinth.
 * @param {Array.<Array.<number>>} grid The grid.
 * @param {Array.<Array.<number>>} nodes The position of each labyrinth node.
 * @param {number} i The i-index of starting coordinate.
 * @param {number} j The j-index of starting coordinate.
 * @param {Array.<number>} p1 The position of the first node.
 * @param {Array.<number>} p2 The position of the second node.
 * @param {number} r1 The radius of the first node.
 * @param {number} r2 The radius of the second node.
 * @returns Whether or not the generation succeeded.
 */
function runPrim(grid, nodes, i, j, p1, p2, r1, r2) {
  let sourceHit = false; let targetHit = false;
  let pq = new Heap(getEdges(nodes, i, j), (a, b) => a[0] - b[0]);
  nodes[i][j] = 2;
  // Cancels the generation if starting point is exposed
  if(checkOrthogonalAdjacents(grid, 2*i, 2*j)) {
    return false;
  }

  // Starts Prim's
  grid[2*i][2*j] = 2;
  while(pq.heap.length > 1) {
    let edge = pq.pop();
    let i0 = edge[1][0]; let j0 = edge[1][1];
    let i1 = edge[2][0]; let j1 = edge[2][1];
    if(nodes[i1][j1] !== 1) {
      continue;
    }
    let alreadyClear = checkOrthogonalAdjacents(grid, 2*i1, 2*j1)
      || checkOrthogonalAdjacents(grid, i0 + i1, j0 + j1, i1 - i0, j1 - j0);

    if(alreadyClear) {
      // Check to see if certain exits were / need to be made
      if(dist(p1[0], p1[1], 2*j1, 2*i1) < r1 + 3) {
        if(sourceHit) {
          continue;
        }
        sourceHit = true;
      }
      else if(dist(p2[0], p2[1], 2*j1, 2*i1) < r2 + 3) {
        if(targetHit) {
          continue;
        }
        targetHit = true;
      }
      else {
        continue;
      }
    }
    // Finalize the edge
    nodes[i1][j1] = 2;
    grid[2*i1][2*j1] = 2;
    grid[i0+i1][j0+j1] = 2;
    if(!alreadyClear) {
      for(let t of getEdges(nodes, i1, j1)) {
        pq.push(t);
      }
    }
  }
  return sourceHit && targetHit;
}

/**
 * Generates labyrinth edges in a grid by specifying lots of bounds.
 * @param {Room} dungeonMap The dungeon map to operate on.
 * @returns Whether or not at least one labyrinth is corrupted.
 */
function generateLabyrinthEdges(dungeonMap) {
  let grid = dungeonMap.minimap;
  let nodes = dungeonMap.dungeon.map((room) => room.pos);
  let n = nodes.length;
  let labyrinthEdges = [];

  // Create two-way adjacency list for all labyrinth nodes
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
  }

  // Start labyrinth generation
  for(let edge of labyrinthEdges) {
    let ineqs = getAdjacentBounds(nodes, adj, edge[0], edge[1])
      .concat(getAdjacentBounds(nodes, adj, edge[1], edge[0]));
    let labyGrid = generateEmptyGrid(Math.floor(grid[0].length/2),
      Math.floor(grid.length/2), 0);
    let radius1 = dungeonMap.dungeon[edge[0]].radius+1;
    let radius2 = dungeonMap.dungeon[edge[1]].radius+1;
    let p1 = nodes[edge[0]];
    let p2 = nodes[edge[1]];
    let midpoint = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2];
    let circularDist = dist(p1[0], p1[1], midpoint[0], midpoint[1]);
    for(let y = 1; y < labyGrid.length-1; y++) {
      for(let x = 1; x < labyGrid[0].length-1; x++) {
        let gridX = 2 * x;
        let gridY = 2 * y;

        // Check linear inequality bounds
        let satisfies = true;
        for(let bound of ineqs) {
          if(ccw_test(bound[1], bound[0], [gridX, gridY]) !== bound[2] && !isCollinear(bound[1], bound[0], [gridX, gridY])) {
            satisfies = false;
            break;
          }
        }
        if(!satisfies) {
          continue;
        }

        // Check circular inequality bounds
        if(dist(2*x, 2*y, midpoint[0], midpoint[1]) >= circularDist) {
          continue;
        }

        // Check whitespaces; condition will be changed later
        let dist1 = dist(gridX, gridY, nodes[edge[0]][0], nodes[edge[0]][1]);
        let dist2 = dist(gridX, gridY, nodes[edge[1]][0], nodes[edge[1]][1]);
        if(dist1 < radius1 || dist2 < radius2) {
          labyGrid[y][x] = 1;
          continue;
        }
        else if(getWallsWithin(grid, gridY, gridX, 1) === 8 && grid[gridY][gridX] === 0) {
          labyGrid[y][x] = 1;
        }
      }
    }

    // Spams Prim until the two rooms are connected
    let foundSpanning = false;
    for(let i = 0; (i < labyGrid.length) && !foundSpanning; i++) {
      for(let j = 0; (j < labyGrid.length) && !foundSpanning; j++) {
        if(labyGrid[i][j] === 1) {
          foundSpanning = runPrim(grid, labyGrid, i, j, p1, p2, radius1, radius2);
        }
      }
    }
    if(!foundSpanning) {
      if(GENERATIONDEBUG) {
        console.log("Labyrinth execution failed");
      }
      return false;
    }
  }
  return true;
}