class DungeonMap {
  constructor(_numberOfRooms){
    this.dungeon = [new Room(15)];
    for(let i=1; i<_numberOfRooms-1; i++){
      this.dungeon.push(new Room(20));
    }
    this.dungeon.push(new Room(30));
    for(let i=1; i<_numberOfRooms; i++){
      let pathChance = random();
      if(pathChance < 0.8 || i+2 > _numberOfRooms){
        if(pathChance < 0.4 || i+2 > _numberOfRooms){
          this.dungeon[i-1].addConnection([i], this.dungeon);
        } 
        else {
          this.dungeon[i-1].addConnection([i+1], this.dungeon);
        }
        
      } 
      else {
        this.dungeon[i-1].addConnection([i, i+1], this.dungeon);
      }
    }
    this.dungeon[0].pos = [0,0];
    let dist1 = 45; 
    let dist2 = 45; 
    let dist3 = 50;
    if(this.dungeon[0].connections.length === 1){
      if(this.dungeon[0].connections[0][0] === 1){
        dist1 = this.dungeon[0].connections[0][1];
      }
      else{
        dist2 = this.dungeon[0].connections[0][1];
      }
    }
    else {
      dist1 = this.dungeon[0].connections[0][1];
      dist2 = this.dungeon[0].connections[1][1];
    }
    if(this.dungeon[1][0] === 2){
      dist3 = this.dungeon[1].connections[0][1];
    }
    let theta = acos((dist1*dist1+dist2*dist2-dist3*dist3)/(2*dist1*dist2))*0.5;
    this.dungeon[1].pos = [Math.abs(cos(theta)*dist1), sin(theta)*dist1];
    this.dungeon[2].pos = [Math.abs(cos(theta)*dist2), -sin(theta)*dist2];
    for(let i=3; i<this.dungeon.length; i++){
      dist1 = 50;
      dist2 = 50;
      if(this.dungeon[i-1].connections[0][0] === i){
        dist1 = this.dungeon[i-1].connections[0][1];
      }
      else if(i === this.dungeon.length-1){
        dist1 = 60;
      }
      if(this.dungeon[i-2].connections.length === 1 && this.dungeon[i-2].connections[0][0] === i){
        dist2 = this.dungeon[i-2].connections[0][1];
      }
      else if(this.dungeon[i-2].connections.length === 2){
        if(this.dungeon[i-2].connections[1][0] === i){
          dist2 = this.dungeon[i-2].connections[1][1];
        } 
      }
      else if(i === this.dungeon.length-1){
        dist2 = 60;
      }
      let angle1 = Math.abs(atan((this.dungeon[i-1].pos[0]-this.dungeon[i-2].pos[0])/(this.dungeon[i-1].pos[1]-this.dungeon[i-2].pos[1])));
      theta = angle1 + acos((dist1*dist1+dist3*dist3-dist2*dist2)/(2*dist1*dist3));
      this.dungeon[i].pos = [this.dungeon[i-1].pos[0]+sin(theta)*dist1, this.dungeon[i-1].pos[1]+cos(theta)*dist1];
    }
  }
}

class Room {
  constructor(_radius){
    this.radius = _radius;
    this.connections = [];
    this.pos = undefined;
  }
  addConnection(_connections, dungeon){
    _connections.forEach(connection => {
      let stairOrMaze = random();
      if(stairOrMaze > 0.7){
        this.connections.push([connection, 10+this.radius+dungeon[connection].radius]);
      }
      else {
        this.connections.push([connection, Math.floor(random(20, 30))+this.radius+dungeon[connection].radius]);
      }
    });
  }
}