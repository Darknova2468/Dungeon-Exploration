/* eslint-disable no-extra-parens */
/* eslint-disable no-undef */

// Eslint disabled for those because names are already defined in other files
// and the parantheses are necessary

function getEffectiveEdgeNode(grid, node) {
  // Get candidate edge nodes
  let x = node[0]; let y = node[1];
  let candidates = [[x, 0], [x, grid.length-1], [0, y], [grid[0].length-1, y]];
  return candidates.reduce((prev, curr) => {
    return dist(prev[0], prev[1], x, y) < dist(curr[0], curr[1], x, y) ? prev : curr;
  });
}

function getMidpoint(p1, p2) {
  return [Math.floor((p1[0]+p2[0])/2), Math.floor((p1[1]+p2[1])/2)];
}

function getIndex(l, target, getAttribute = (x) => x) {
  return parseInt(Object.keys(l).find((key) => getAttribute(l[key]) === target));
}

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

function getEdges(nodes, i, j) {
  let l = [];
  for(let iDisp of [-1, 0, 1]) {
    for(let jDisp of [-1, 0, 1]) {
      if((iDisp === 0) ^ (jDisp !== 0)) {
        continue;
      }
      let newI = i + iDisp;
      let newJ = j + jDisp;
      if(verifyIndices(nodes, newI, newJ) && nodes[newI][newJ] === 1) {
        l.push([random(), [i, j], [newI, newJ]]);
      }
    }
  }
  return l;
}

function checkOrthogonalAdjacents(grid, i, j, iNode = 0, jNode = 0) {
  for(let iDisp of [-1, 0, 1]) {
    for(let jDisp of [-1, 0, 1]) {
      if((iDisp !== 0) && (jDisp !== 0)) {
        continue;
      }
      // Check dot product (edge condition only)
      if(Math.abs(iDisp * iNode + jDisp * jNode) > 1e-8) {
        continue;
      }
      let newI = i + iDisp;
      let newJ = j + jDisp;
      if(verifyIndices(grid, newI, newJ) && grid[newI][newJ] === 1) {
        return true;
      }
    }
  }
  return false;
}

function runPrim(grid, nodes, i, j, p1, p2, r1, r2) {
  let sourceHit = false; let targetHit = false;
  let pq = new Heap(getEdges(nodes, i, j), (a, b) => a[0] - b[0]);
  nodes[i][j] = 2;
  if(checkOrthogonalAdjacents(grid, 2*i, 2*j)) {
    return false;
  }
  grid[2*i][2*j] = 1;
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
    grid[2*i1][2*j1] = 1;// + debugSpecial;
    grid[i0+i1][j0+j1] = 1;// + debugSpecial;
    if(!alreadyClear) {
      for(let t of getEdges(nodes, i1, j1)) {
        pq.push(t);
      }
    }
  }
  return sourceHit && targetHit;
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
    for(let y = 0; y < labyGrid.length; y++) {
      for(let x = 0; x < labyGrid[0].length; x++) {
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

    let foundSpanning = false;
    for(let i = 0; (i < labyGrid.length) && !foundSpanning; i++) {
      for(let j = 0; (j < labyGrid.length) && !foundSpanning; j++) {
        if(labyGrid[i][j] === 1) {
          foundSpanning = runPrim(grid, labyGrid, i, j, p1, p2, radius1, radius2);
        }
      }
    }
    if(!foundSpanning) {
      console.log("Labyrinth execution failed");
      return false;
    }
  }
  return true;
}