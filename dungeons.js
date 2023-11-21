class DungeonMap {
  constructor(_numberOfRooms){
    //builds room nodes;
    this.dungeon = [new Room(15)];
    for(let i=1; i<_numberOfRooms-1; i++){
      this.dungeon.push(new Room(20));
    }
    this.dungeon.push(new Room(30));

    //adds procedural distances
    for(let i=1; i<_numberOfRooms; i++){
      this.dungeon[i-1].addConnection(1+(random() > 0.8 || i+2 > _numberOfRooms), i, _numberOfRooms, this.dungeon, i === _numberOfRooms-1);
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
      let angle1 = Math.abs(atan((this.dungeon[i-1].pos[0]-this.dungeon[i-2].pos[0])/(this.dungeon[i-1].pos[1]-this.dungeon[i-2].pos[1])));
      theta = angle1 + cosineLaw(dist1, dist3, dist2);
      this.dungeon[i].pos = [this.dungeon[i-1].pos[0]+sin(theta)*dist1, this.dungeon[i-1].pos[1]+cos(theta)*dist1];
    }
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
          this.connections.push([index+1, dungeon[index].radius+this.radius+10, 0]);
        }
        else {
          this.connections.push([index, dungeon[index].radius+this.radius+10, 0]);
          this.connections.push([index+1, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
        }
      }
      else {
        this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
        distance = random() < 0.7 ? 10:Math.floor(random(20, 30));
        this.connections.push([index+1, dungeon[index].radius+this.radius+distance, 1+(distance>10)]);
      }
    }
  }
}

//finds an angle given three side lengths
function cosineLaw(a, b, c){
  return acos((a*a+b*b-c*c)/(2*a*b));
}