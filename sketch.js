// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let scaleFactor = 2;
let dict = new Array(5).fill(null);

function setup() {
  createCanvas(400*scaleFactor, 200*scaleFactor);
  noLoop();
  stroke(255);
  strokeWeight(scaleFactor*10);
  myDungeon = new DungeonMap(5);
  console.log(myDungeon);
}

function draw() {
  background(0);
  myDungeon.dungeon.forEach((room) => {
    let [x, y] = room.pos;
    x = (x+20)*scaleFactor;
    y = (y+100)*scaleFactor;
    stroke(255);
    room.connections.forEach(path => {
      line(x, y, (myDungeon.dungeon[path[0]].pos[0]+20)*scaleFactor, (myDungeon.dungeon[path[0]].pos[1]+100)*scaleFactor);
    });
    noStroke();
    circle(x, y, room.radius*2*scaleFactor);
  });
}
