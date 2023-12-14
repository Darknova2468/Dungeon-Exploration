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
  // NOTE: clockwise when displayed due to CS coordinates.
  // Mathematically counterclockwise however.
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
  // console.log(a);
  // console.log(b);
  // if(isCollinear(pivot, a, b)) {
  //   return dist(pivot[0], pivot[1], b[0], b[1]) - dist(pivot[0], pivot[1], a[0], a[1]);
  // }
  let d1x = a[0] - pivot[0];
  let d2x = b[0] - pivot[0];
  let d1y = a[1] - pivot[1];
  let d2y = b[1] - pivot[1];
  let angleDiff = getAngle(d2y, d2x) - getAngle(d1y, d1x);
  if(Math.abs(angleDiff) < 1e-8) {
    return dist(pivot[0], pivot[1], b[0], b[1]) - dist(pivot[0], pivot[1], a[0], a[1]);
  }
  return angleDiff;
}

function getConvexHull(nodes, extractCoords) {
  let coordsToIndex = [];
  let points = [];
  for(let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    let coords = extractCoords(node);
    points.push(coords);
    coordsToIndex[coords] = i;
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
  // return points;

  // Running the algorithm
  let stack = [];
  stack.push(points[n-1]); stack.push(points[0]); stack.push(points[1]);
  i = 2;
  while(i < n) {
    // eslint-disable-next-line no-undef
    if(DEBUG) {
      console.log("[Convex Hull] Stack contents: ".concat(stack));
    }
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
    convexHull.push(coordsToIndex[t]);
  }
  convexHull.pop();
  return convexHull;
}

function testConvexHull() {
  // eslint-disable-next-line no-undef
  console.log(getConvexHull(myDungeon.dungeon, (room) => room.pos));
}

const deathMessages = ["YOU DIED", "skill issue lol", "Try using left click next time", "I heard dodging increases your chance of survival", "You just discovered the health bar!", "Sadly, you aren't invincible.", "THE UNIVERSE HATES YOU", "It's funny watching you die yet again", "pathetic", "Here we go again", "I could've done better than you there", "I'm sending you to the timeout corner", "Try dodging next time.", "You were supposed to be the protagonist", "You're learning! too slowly though", "Have you considered moving?", "Were you trying there?", `Did something get in your eye?
I hope it's in your lungs next time`, "laughable", "go touch grass", "You know you can't play the game while you're dead", "100K5 1iK3 Y0U G0t PWN3D 7H3R3", "rip bozo", "[CENSORED]", "Are you procrastinating on something?", "hey clown do that again", "Do you need me to sell you the skill solution?", "L + Ratio...", "I'm back, what did I miss?", "You could've blamed gravity if it existed", "maggots", `Nice hustle, tons of fun,
Next time eat a salad!`, "They murdered your toys as well.", "At least you died for honor -- and my amusement!", "Imagine not having depth perception", "Oops! That was not medicine!", "You need a healer.", "Think fast, chucklenuts", "I would call you short if there was something left to measure.", "You were slain by your own incompetence"];