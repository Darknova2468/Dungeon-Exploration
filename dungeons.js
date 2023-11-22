/* eslint-disable no-undef */
class DungeonMap {
  constructor(_numberOfRooms, _twoPathChance){
    //builds room nodes;
    this.dungeon = [new Room(15)];
    for(let i=1; i<_numberOfRooms-1; i++){
      this.dungeon.push(new Room(20));
    }
    this.dungeon.push(new Room(30));

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
      dist1 = this.dungeon[i-1].connections[0][1];
      dist2 = this.dungeon[i-2].connections[1][1];
      let alpha = atan((this.dungeon[i-1].pos[1]-this.dungeon[i-2].pos[1])/(this.dungeon[i-1].pos[0]-this.dungeon[i-2].pos[0]));
      let beta = cosineLaw(dist1, dist3, dist2);
      let theta = PI-(alpha+beta);
      let point = [this.dungeon[i-1].pos[0]+sin(theta)*dist1, this.dungeon[i-1].pos[1]+cos(theta)*dist1];
      let line1 = new Line(this.dungeon[i-3].pos, this.dungeon[i-1].pos);
      let line2 = new Line(this.dungeon[i-2].pos, point);
      this.dungeon[i].pos = point;
      if(line1.intersects(line2)) {
        let line3 = new Line(this.dungeon[i-2].pos, this.dungeon[i-1].pos);
        this.dungeon[i].pos = line3.reflect(point);
      }
    }

    //finds bounding box of the map
    let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
    this.dungeon.forEach(room => {
      minX = min(minX, room.pos[0]-room.radius);
      maxX = max(maxX, room.pos[0]+room.radius);
      minY = min(minY, room.pos[1]-room.radius);
      maxY = max(maxY, room.pos[1]+room.radius);
    });
    
    //creates map
    let offset = [-minX+1, -minY+1];
    this.minimap = generateEmptyGrid(Math.floor(maxX-minX)+2, Math.floor(maxY-minY)+2);
    
    this.dungeon.forEach(room => {
      let pos1 = room.pos;
      room.connections.forEach(connection => {
        if(connection[2] === 1) {
          let pos2 = this.dungeon[connection[0]].pos;
          generateCaveEdge(this.minimap, pos1[1] + offset[1], pos1[0] + offset[0],
            pos2[1] + offset[1], pos2[0] + offset[0]);
        }
      });
    });
    
    this.dungeon.forEach(room => {
      let raster = generatePrecursorDungeonRoom(room.radius);
      this.minimap = integrateRaster(this.minimap, raster, room.pos, offset);
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
    let distance = random() < 0.7 ? 10:Math.floor(random(20, 30));
    if(check){
      this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
    }
    else {
      if(numberOfConnections === 1){      
        if(random() < 0.5 && index+1 < numberOfRooms){
          this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+10, 0]);
        }
        else {
          this.connections.push([index, dungeon[index].radius+this.radius+10, 0]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>10)]);
        }
      }
      else {
        this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
        distance = random() < 0.7 ? 10:Math.floor(random(20, 30));
        this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>10)]);
      }
    }
  }
}

class Line {
  constructor(_point1, _point2){
    this.point1 = _point1;
    this.point2 = _point2;
    this.slope = (_point2[1]-_point1[1])/(_point2[0]-_point1[0]);
    this.yint = _point1[1]-this.slope*_point1[0];
  }
  //checks if two line segments intersect
  intersects(line){
    let x = (line.yint-this.yint)/(this.slope-line.slope);
    let y = x*this.slope+this.yint;
    return between(x, this.point1[0], this.point2[0]) && between(x, line.point1[0], line.point2[0]) &&
           between(y, this.point1[1], this.point2[1]) && between(y, line.point1[1], line.point2[1]);
  }
  //reflects a point along a line
  reflect(point){
    let dx = this.point2[0]-this.point1[0];
    let dy = this.point2[1]-this.point1[1];
    let a = (dx*dx-dy*dy)/(dx*dx+dy*dy);
    let b = 2*dx*dy/(dx*dx + dy*dy);
    let x = a*(point[0]-this.point1[0])+b*(point[1]-this.point1[1])+this.point1[0];
    let y = b*(point[0]-this.point1[0])-a*(point[1]-this.point1[1])+this.point1[1];
    return[x, y];
  }
}

function integrateRaster(minimap, raster, pos, offset){
  pos[0] = Math.floor(pos[0]+offset[0]-raster.length/2);
  pos[1] = Math.floor(pos[1]+offset[1]-raster[0].length/2);
  for(let y=0; y<raster.length; y++){
    for(let x=0; x<raster[y].length; x++){
      minimap[y+pos[1]][x+pos[0]] ||= raster[y][x];
    }
  }
  return minimap;
}

//finds an angle given three side lengths
function cosineLaw(a, b, c){
  return acos((a*a+b*b-c*c)/(2*a*b));
}

//checks if a number is with in a bound
function between(point, bound1, bound2){
  let minimum = min(bound1, bound2);
  let maximum = max(bound1, bound2);
  return minimum <= point && maximum >= point;
}

//generates single cave
function generatePrecursorDungeonRoom(radius) {
  let room = generateEmptyGrid(2*radius + 1, 2*radius + 1);
  generateCaveNode(room, radius, radius, radius - 4, radius);
  for(let i = 0; i < 3; i++) {
    room = evaluateNext(room);
  }
  return room;
}

function findPoint3(point1, point2, dist1, dist2, dist3) {
  // Calculate the vector between point1 and point2
  let vector12 = [point2[0] - point1[0], point2[1] - point1[1]];

  // Calculate the distance between point1 and point2
  let distance12 = Math.sqrt(vector12[0] ** 2 + vector12[1] ** 2);

  // Calculate the coordinates of the midpoint between point1 and point2
  let midpoint = [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2
  ];

  // Calculate the distance from the midpoint to the unknown point P3
  let distanceMidpointP3 = (dist1 ** 2 - dist2 ** 2 + distance12 ** 2) / (2 * distance12);

  // Calculate the height difference
  let h = Math.sqrt(dist1 ** 2 - distanceMidpointP3 ** 2);

  // Calculate the unit vector in the direction of point1 to point2
  let unitVector12 = [vector12[0] / distance12, vector12[1] / distance12];

  // Calculate the coordinates of both solutions for point P3
  let solution1 = [
    midpoint[0] + unitVector12[1] * h,
    midpoint[1] - unitVector12[0] * h
  ];

  let solution2 = [
    midpoint[0] - unitVector12[1] * h,
    midpoint[1] + unitVector12[0] * h
  ];

  return [solution1, solution2];
}