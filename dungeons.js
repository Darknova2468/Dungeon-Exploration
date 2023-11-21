class DungeonMap {
  constructor(_numberOfRooms, _twoPathChance, _bridgeOrMazeChance, _bridgeLength, _mazeLength, _emptyPathLength){
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
      let angle1 = atan((this.dungeon[i-1].pos[0]-this.dungeon[i-2].pos[0])/(this.dungeon[i-1].pos[1]-this.dungeon[i-2].pos[1]));
      theta = angle1 + cosineLaw(dist1, dist3, dist2);
      let point = [this.dungeon[i-1].pos[0]+sin(theta)*dist1, this.dungeon[i-1].pos[1]+cos(theta)*dist1];
      let line1 = new Line(this.dungeon[i-3].pos, this.dungeon[i-1].pos);
      let line2 = new Line(this.dungeon[i-2].pos, point);
      if(line1.intersects(line2)){
        let line3 = new Line(this.dungeon[i-1].pos, this.dungeon[i-2].pos);
        point = line3.reflect(point);
      }
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
    
    //creates map
    let offset = [0, 0];
    let map = new Array(Math.floor(maxX - minX)+2).fill(false);
    map.forEach(row => {
      new Array(Math.floor(maxY - minY)+2).fill(false);
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