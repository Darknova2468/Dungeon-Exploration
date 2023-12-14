/* eslint-disable no-undef */
class DungeonMap {
  constructor(_numberOfRooms, _twoPathChance, _enemyTileSet){
    this.enemies = [];

    //builds room nodes;
    this.dungeon = [new Room(6)];
    for(let i=1; i<_numberOfRooms-1; i++){
      this.dungeon.push(new Room(floor(random(7, 9))));
    }
    this.dungeon.push(new Room(10));

    //adds procedural distances
    for(let i=1; i<_numberOfRooms; i++){
      this.dungeon[i-1].addConnection(1+(random() < _twoPathChance || i+2 > _numberOfRooms), i, _numberOfRooms, this.dungeon, i === _numberOfRooms-1);
    }

    //defines starting triangle
    let dist1 = this.dungeon[0].connections[0][1];
    let dist2 = this.dungeon[0].connections[1][1];
    let dist3 = this.dungeon[1].connections[0][1];
    
    let theta = 0.5*cosineLaw(dist1, dist2, dist3);
    this.dungeon[1].pos = [Math.abs(cos(theta)*dist1), sin(theta)*dist1];
    this.dungeon[2].pos = [Math.abs(cos(theta)*dist2), -sin(theta)*dist2];

    //generates the rest of the tree
    for(let i=3; i<this.dungeon.length; i++){
      dist1 = this.dungeon[i-2].connections[1][1];
      dist2 = this.dungeon[i-1].connections[0][1];
      dist3 = this.dungeon[i-2].connections[0][1];
      let point1 = this.dungeon[i-2].pos;
      let point2 = this.dungeon[i-1].pos;
      let alpha = atan((point2[1] - point1[1])/(point2[0] - point1[0]));
      if(point2[0] - point1[0] < 0) {
        alpha += Math.PI;
        alpha %= 2*Math.PI;
      }
      let beta = cosineLaw(dist1, dist3, dist2);
      let theta = alpha - beta * Math.pow(-1, i);
      let point = [point1[0] + dist1 * cos(theta), point1[1] + dist1 * sin(theta)];
      this.dungeon[i].pos = point;
    }

    //finds bounding box of the map
    let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
    this.dungeon.forEach(room => {
      minX = min(minX, room.pos[0]-room.radius);
      maxX = max(maxX, room.pos[0]+room.radius);
      minY = min(minY, room.pos[1]-room.radius);
      maxY = max(maxY, room.pos[1]+room.radius);
    });
    
    // Adjust the position
    this.offset = [-minX+1, -minY+1];
    this.dungeon.forEach(room => {
      room.pos = [Math.floor(room.pos[0] + this.offset[0]), Math.floor(room.pos[1] + this.offset[1])];
    });

    //creates Map
    this.minimap = generateEmptyGrid(Math.floor(maxX-minX)+2, Math.floor(maxY-minY)+2);

    this.playerPos = this.offset;
    
    // Generate edges
    this.dungeon.forEach(room => {
      let pos1 = room.pos;
      room.connections.forEach(connection => {
        if(connection[2] === 1) {
          let pos2 = this.dungeon[connection[0]].pos;
          // console.log(pos1[0], pos2[0]);
          generateCaveEdge(this.minimap, pos1[1], pos1[0],
            pos2[1], pos2[0]);
        }
      });
    });
    
    // Generate cave nodes
    this.dungeon.forEach(room => {
      let raster = generatePrecursorDungeonRoom(room.radius);
      this.minimap = integrateRaster(this.minimap, raster, room.pos, this.offset);
    });

    // Generate labyrinths
    generateLabyrinthEdges(this);

    // Temporary enemy testing
    for(let i = 0; i < 3; i++) {
      this.enemies.push(new Slime([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, _enemyTileSet[0]));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new LavaSlime([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, _enemyTileSet[1]));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new FrostSlime([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, "lightskyblue"));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new Zombie([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, _enemyTileSet[2]));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new Goblin([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, "chocolate"));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new Skeleton([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, "blanchedalmond"));
    }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(new Phantom([this.playerPos[0]+ random(-2, 2), this.playerPos[1] + random(-2, 2)], 1, this.minimap, "black"));
    }
  }
  move(player, time){
    this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    this.enemies.forEach(enemy => {
      enemy.operate(player, this.enemies, time);
    });
  }
  display(screenCenter, screenSize, scale){
    this.enemies.forEach(enemy => {
      enemy.display(screenCenter, screenSize, scale);
    }); 
  }
}

class Room {
  constructor(_radius){
    this.radius = _radius;
    this.connections = [];
    this.pos = [0, 0];
  }
  addConnection(numberOfConnections, index, numberOfRooms, dungeon, check){
    //pushes connections to node
    let distance = random() < 0.5 ? 3:Math.floor(random(8, 12));
    if(check){
      this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
    }
    else {
      if(numberOfConnections === 1){      
        if(random() < 0.5 && index+1 < numberOfRooms){
          this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+3, 0]);
        }
        else {
          this.connections.push([index, dungeon[index].radius+this.radius+3, 0]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
        }
      }
      else {
        this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
        distance = random() < 0.7 ? 3:Math.floor(random(8, 12));
        this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
      }
    }
  }
}

//using two points creates all parameters of a line
class Line {
  constructor(_point1, _point2){
    this.point1 = _point1;
    this.point2 = _point2;
    this.slope = (_point2[1]-_point1[1])/(_point2[0]-_point1[0]);
    this.yint = _point1[1]-this.slope*_point1[0];
  }
}

//integrates a raster of 1s and 0s into a larger array
function integrateRaster(minimap, raster, pos){
  let pos1 = [Math.floor(pos[0]-(raster.length+1)/2),
    Math.floor(pos[1]-(raster[0].length+1)/2)];
  for(let y=0; y<raster.length; y++){
    for(let x=0; x<raster[y].length; x++){
      minimap[y+pos1[1]][x+pos1[0]] ||= raster[y][x];
    }
  }
  // minimap[pos[1]][pos[0]] = cellTypes.exit;
  return minimap;
}

/**
 * Finds an angle in a triangle given three side lengths.
 * @param {number} leg1 The first leg.
 * @param {number} leg2 The second leg.
 * @param {number} opp The opposite angle.
 * @returns The angle of the angle in radians.
 */
function cosineLaw(leg1, leg2, opp){
  if(DEBUG) {
    console.assert(leg1 + leg2 > opp,
      "[Cosine Law] Opposite side length is too short!");
    console.assert(opp + leg2 > leg1,
      "[Cosine Law] Leg 1 side length is too short!");
    console.assert(opp + leg1 > leg2,
      "[Cosine Law] Leg 2 side length is too short!");
  }
  return acos((leg1*leg1+leg2*leg2-opp*opp)/(2*leg1*leg2));
}

//checks if a number is with in a bound
function between(point, bound1, bound2){
  let minimum = min(bound1, bound2);
  let maximum = max(bound1, bound2);
  return minimum <= point && maximum >= point;
}

//generates a single organic shaped room
function generatePrecursorDungeonRoom(radius) {
  let room = generateEmptyGrid(2*radius - 1, 2*radius - 1);
  room = generateCaveNode(room, radius, radius, radius - 4, radius);
  return room;
}

/**
 * Converts an empty array to a uniform 2d array.
 * @param {Array} grid The grid to fill.
 * @param {number} x The number of cells per row.
 * @param {number} toFill The number to fill the cells with.
 */
function generateEmptyGrid(x = xSize, y = ySize, toFill = 0) {
  let emptyGrid = new Array(y);
  for(let i = 0; i < y; i++) {
    emptyGrid[i] = new Array(x).fill(toFill);
  }
  return emptyGrid;
}