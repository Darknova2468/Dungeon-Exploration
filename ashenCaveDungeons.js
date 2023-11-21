/* eslint-disable no-undef */
function attemptCaveNodePlacement(grid) {
  let i = Math.floor(random(ySize - 2*caveNodePadding) + caveNodePadding);
  let j = Math.floor(random(xSize - 2*caveNodePadding) + caveNodePadding);
  for(let node of caveNodes) {
    if(dist(i, j, node[0], node[1]) < caveNodeSeparation) {
      return false;
    }
  }
  generateCaveNode(grid, i, j);
  // if(caveNodes.length > 0) {
  //   generateCaveEdge(grid, i, j, caveNodes[caveNodes.length-1][0], caveNodes[caveNodes.length-1][1]);
  // }
  caveNodes.push([i, j]);
  return true;
}

function placeCaveNodes(grid) {
  generateEmptyGrid(grid);
  caveNodes = [];
  let numTrials = 0;
  while(caveNodes.length < numNodes && numTrials < trialLimit) {
    attemptCaveNodePlacement(grid);
    numTrials++;
  }
  if(numTrials >= 100) {
    if(DEBUG) {
      console.log("[Cave Nodes] Cave node placement failed, retrying...");
    }
    return false;
  }
  // generateCaveNode(grid, 15, 30);
  if(DEBUG) {
    console.log("[Cave Nodes] Cave node placement succeeded!");
  }
  return true;
}

function temporaryEdgeTest() {
  caveNodes = [];
  generateCaveNode(grid, 15, 30);
  generateCaveNode(grid, 30, 70);
  generateCaveEdge(grid, 15, 30, 30, 70);
  grid[15][30] = cellTypes.exit;
  grid[30][70] = cellTypes.exit;
}

function runCavePrim() {
  let numNodes = caveNodes.length;
  let adj = new Array(numNodes);
  let visited = new Array(numNodes).fill(false);
  // visited[0] = true;
  for(let i = 0; i < numNodes; i++) {
    adj[i] = [];
    for(let j = 0; j < numNodes; j++) {
      adj[i].push(dist(caveNodes[i][0], caveNodes[i][1], caveNodes[j][0], caveNodes[j][1]));
    }
  }
  // Node format: current, previous, dist
  let pq = new Heap([[0, 0, 0]], (a, b) => a[2] - b[2]);
  while(pq.heap.length > 1) {
    let t = pq.pop();
    let curr = t[0];
    let prev = t[1];
    if(visited[curr]) {
      continue;
    }
    // console.log(t);
    generateCaveEdge(grid, caveNodes[curr][0], caveNodes[curr][1], caveNodes[prev][0], caveNodes[prev][1]);
    visited[curr] = true;
    for(let i = 0; i < numNodes; i++) {
      if(visited[i]) {
        continue;
      }
      pq.push([i, curr, adj[i][curr]]);
    }
  }
}

/**
 * Generates a new level.
 */
function generateAshenCaveLevel() {
  generateEmptyGrid(grid);
  // Generate caves
  // eslint-disable-next-line curly
  while(!placeCaveNodes(grid));
  runCavePrim();

  for(let i = 0; i < 3; i++) {
    grid = evaluateNext(grid);
  }
  displayGrid(grid);

  // Generate maze
  // insertNodes(grid, nodes);
  // generatePerfectMaze();
}