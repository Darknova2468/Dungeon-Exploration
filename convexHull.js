/**
 * Convex hull implementation: Graham's Scan algorithm
 * Modified from Competitive Programming 3 by From Halim et al.
 * (Uses xy coordinates rather than ij (yx) coordinates)
 */

let pivot;

function crossDet(p1, p2) {
  return p1[0] * p2[1] - p1[1] * p2[0];
}

function getVec(p1, p2) {
  return [p2[0] - p1[0], p2[1] - p1[1]];
}

function ccw_test(p1, p2, p3) {
  // console.log(crossDet(getVec(p1, p2), getVec(p1, p3)));
  return crossDet(getVec(p1, p2), getVec(p1, p3)) < 0;
}

function isCollinear(p1, p2, p3) {
  return Math.abs(crossDet(getVec(p1, p2), getVec(p1, p3))) < 1e-8;
}

function getAngle(dy, dx) {
  let theta = atan(dy/dx) + 2 * Math.PI;
  if(dx < 0) {
    theta += Math.PI;
  }
  return theta % (2*Math.PI);
}

function compareAngles(a, b) {
  if(isCollinear(pivot, a, b)) {
    return dist(pivot, b) - dist(pivot, a);
  }
  let d1x = a[0] - pivot[0];
  let d2x = b[0] - pivot[0];
  let d1y = a[1] - pivot[1];
  let d2y = b[1] - pivot[1];
  return getAngle(d2y, d2x) - getAngle(d1y, d1x);
}

function getConvexHull(nodes, extractCoords) {
  let coordsToNodes = [];
  let points = [];
  for(let node of nodes) {
    let coords = extractCoords(node);
    points.push(coords);
    coordsToNodes[coords] = node;
  }
  let i, j;
  let n = points.length;
  if(n <= 3) {
    return nodes;
  }

  // Move pivot to first index
  let p0 = 0;
  for(i = 1; i < n; i++) {
    if(points[i][1] < points[p0][1] || 
      points[i][1] === points[p0][1] && points[i][0] > points[p0][0]) {
      p0 = i;
    }
  }
  // console.log(points);
  let tmp = structuredClone(points[0]); points[0] = points[p0]; points[p0] = tmp;
  pivot = points[0];
  // console.log(pivot);
  points = [points[0]].concat(points.slice(1, n).sort(compareAngles));
  // console.log(points);
  // return points;

  // Running the algorithm
  let stack = [];
  stack.push(points[n-1]); stack.push(points[0]); stack.push(points[1]);
  i = 2;
  while(i < n) {
    console.log("[Convex Hull] Stack contents: ".concat(stack));
    j = stack.length - 1;
    if(ccw_test(stack[j-1], stack[j], points[i])) {
      stack.push(points[i]);
      i++;
    }
    else {
      stack.pop();
    }
  }

  // Answer extraction
  let convexHull = [];
  for(let t of stack) {
    convexHull.push(coordsToNodes[t]);
  }
  convexHull.pop();
  return convexHull;
}

function testConvexHull() {
  // eslint-disable-next-line no-undef
  console.log(getConvexHull(myDungeon.dungeon, (room) => room.pos));
}