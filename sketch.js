/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let scaleFactor = 2;

function setup() {
  createCanvas(400*scaleFactor, 200*scaleFactor);
  noLoop();
  stroke(255);
  strokeWeight(scaleFactor*10);
  myDungeon = new DungeonMap(10, 0.3);
  console.log(myDungeon);
}

function draw() {
  background(0);
  myDungeon.dungeon.forEach((room, index) => {
    let [x, y] = room.pos;
    x = (x+20)*scaleFactor;
    y = (y+50)*scaleFactor;
    stroke(127);
    room.connections.forEach(path => {
      if(path[2] > 0){
        line(x, y, (myDungeon.dungeon[path[0]].pos[0]+20)*scaleFactor, (myDungeon.dungeon[path[0]].pos[1]+50)*scaleFactor);
      }
    });
    noStroke();
    fill(255);
    circle(x, y, room.radius*2*scaleFactor);
    fill(0);
    text(index, x, y);
  });
}