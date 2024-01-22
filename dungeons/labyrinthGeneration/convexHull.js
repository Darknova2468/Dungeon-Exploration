/* eslint-disable no-undef */

/**
 * Convex hull implementation: Graham's Scan algorithm
 * Modified from Competitive Programming 3 by From Halim et al.
 * (Uses xy coordinates rather than ij (yx) coordinates)
 * 
 * This implementation is used to 
 */

let pivot;

/**
 * Finds the determinant of a 2x2 matrix (or two array of length 2).
 * @param {Array.<number>} p1 The first vector.
 * @param {Array.<number>} p2 The second vector.
 * @returns The determinant.
 */
function crossDet(p1, p2) {
  return p1[0] * p2[1] - p1[1] * p2[0];
}

/**
 * Returns the displacement vector from a starting vector to a destination
 *   vector.
 * @param {Array.<number>} p1 The starting vector.
 * @param {Array.<number>} p2 The destination vector.
 * @returns The displacement vector.
 */
function getVec(p1, p2) {
  return [p2[0] - p1[0], p2[1] - p1[1]];
}

/**
 * Determines whether a triplet of three points are counterclockwise in
 *   arrangement. Note that this determines whether they are
 *   counterclockwise in Cartesian coordinates; this means that they actually
 *   look clockwise when displayed in CS coordinates.
 * @param {Array.<number>} p1 The first point.
 * @param {Array.<number>} p2 The second point.
 * @param {Array.<number>} p3 The third point.
 * @returns Whether the points are "counterclockwise".
 */
function ccw_test(p1, p2, p3) {
  return crossDet(getVec(p1, p2), getVec(p1, p3)) < 0;
}

/**
 * Determines whether three points are collinear to a precision of 1e-8.
 * @param {Array.<number>} p1 The first point.
 * @param {Array.<number>} p2 The second point.
 * @param {Array.<number>} p3 The third point.
 * @returns Whether the points are approximately collinear.
 */
function isCollinear(p1, p2, p3) {
  return Math.abs(crossDet(getVec(p1, p2), getVec(p1, p3))) < 1e-8;
}

/**
 * Returns the polar angle of a vector.
 * @param {number} dy The y-displacement.
 * @param {number} dx The x-displacement.
 * @returns The angle.
 */
function getAngle(dy, dx) {
  let theta = atan(dy/dx) + 2 * Math.PI;
  if(dx < 0) {
    theta += Math.PI;
  }
  return theta % (2*Math.PI);
}

/**
 * Comparator of angles used for sorting points in Graham's Scan algorithm.
 *   This function returns the difference of angles, or the difference in
 *   distance if they are approximately collinear.
 * @param {Array.<number>} a The first vector.
 * @param {Array.<number>} b The second vector.
 * @returns The result of the comparator.
 */
function compareAngles(a, b) {
  let d1x = a[0] - pivot[0];
  let d2x = b[0] - pivot[0];
  let d1y = a[1] - pivot[1];
  let d2y = b[1] - pivot[1];
  let angleDiff = getAngle(d2y, d2x) - getAngle(d1y, d1x);
  if(Math.abs(angleDiff) < 1e-8) {
    return dist(pivot[0], pivot[1], b[0], b[1])
      - dist(pivot[0], pivot[1], a[0], a[1]);
  }
  return angleDiff;
}

/**
 * Gets all the cave nodes that reside on the convex hull.
 * @param {Array.<Node>} nodes The list of nodes.
 * @param {function} extractCoords The function that gets a node's position.
 * @returns The list of points on the convex hull.
 */
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
    // If less than 3 points, all nodes are part of the convex hull
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
  let tmp = structuredClone(points[0]); points[0] = points[p0]; points[p0] = tmp;
  pivot = points[0];
  points = [points[0]].concat(points.slice(1, n).sort(compareAngles));

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

/**
 * Tests whether the convex hull algorithm works.
 */
function testConvexHull() {
  // eslint-disable-next-line no-undef
  console.log(getConvexHull(myDungeon.dungeon, (room) => room.pos));
}

// Hid the death messages here to partially avert suspecting code hunters
const deathMessages = ["YOU DIED", "skill issue lol", "Try using left click next time", "I heard dodging increases your chance of survival", "You just discovered the health bar!", "Sadly, you aren't invincible.", "THE UNIVERSE HATES YOU", "It's funny watching you die yet again", "pathetic", "Here we go again", "I could've done better than you there", "I'm sending you to the timeout corner", "Try dodging next time.", "You were supposed to be the protagonist", "You're learning! too slowly though", "Have you considered moving?", "Were you trying there?", `Did something get in your eye?
I hope it's in your lungs next time`, "laughable", "go touch grass", "You know you can't play the game while you're dead", "100K5 1iK3 Y0U G0t PWN3D 7H3R3", "rip bozo", "[CENSORED]", "Are you procrastinating on something?", "hey clown do that again", "Do you need me to sell you the skill solution?", "L + Ratio...", "I'm back, what did I miss?", "You could've blamed gravity if it existed", "maggots", `Nice hustle, tons of fun,
Next time eat a salad!`, "They murdered your toys as well.", "At least you died for honor -- and my amusement!", "Imagine not having depth perception", "Oops! That was not medicine!", "You need a healer.", "Think fast, chucklenuts", "I would call you short if there was something left to measure.", "You were slain by your own incompetence", "too slow", "Looks like your hero training needs a training montage.", "Congratulations! You found the perfect way to fail.", "Better luck next time! Or, you know, any time really.", "You fought valiantly... against the urge to rage-quit.", "Even the legendary hero needs a coffee break... or twenty.", "Your quest for glory has been temporarily interrupted by reality.", "Remember, every epic tale has its bloopers reel.", "Your journey has hit a small detour, also known as 'game over'.", "Looks like your skill points were in the wrong skills.", "The road to victory is paved with... well, lots of game over screens, apparently.", "Game over: The final boss was your own mistakes.", "You've been defeated! Time to re-evaluate your life choices.", "Unfortunately, you've reached the 'not-so-happy' ending.", "You got a game over! No refunds on hero supplies.", "Oops, you went on an unexpected vacation.", "Failure is just another step towards eventual success... or so they say.", "Your performance was legendary... in a 'wait, what just happened?' kind of way.", "Game over: It happens to the best of us... and apparently, to you too.", "The game over screen: where heroes rest and reconsider their life choices."];