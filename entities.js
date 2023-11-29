const radius = 2;

class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _colour){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.colour = _colour;
    this.radius = radius;
  }
  move(direction, time){
    let [i, j] = direction;
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    if(this.collisionMap[Math.floor(this.pos[1]+j*distance)][Math.floor(this.pos[0])] !== 0){
      this.pos[1] += j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      this.pos[0] += i*distance;
    }
  }
  display(screenCenter, screenSize, size){
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    x += screenSize[0]*0.5;
    y += screenSize[1]*0.5;
    let scaleX = width/screenSize[0];
    let scaleY = height/screenSize[1];
    fill(this.colour);
    ellipse(x*scaleX, y*scaleX, scaleX*0.75, scaleY*0.75);
  }
}

class Player extends Entity {
  constructor(_pos, _collisionMap){
    super(_pos, 10, 0, 15, _collisionMap, color(255,255,255), "player");
  }
}

class Slime extends Entity {
  constructor(_pos, _level, _collisionMap) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 0, _collisionMap, "green", "slime");
    this.detectionRange = 100;
    this.attackRange = 0;
  }
  operate(player, time) {
    const distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    if(distance > this.detectionRange) {
      this.idle();
    }
    else if(distance > this.attackRange){
      this.move(player.pos, time);
    }
    else {
      this.attack();
    }
  }
  idle() {

  }
  move(pos, time){
    let mag = dist(pos[0], pos[1], this.pos[0], this.pos[1]);
    let dx = (pos[0]-this.pos[0])/mag*this.speed*time;
    let dy = (pos[1]-this.pos[1])/mag*this.speed*time;
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
      this.pos[0] += dx;
    }
    if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
      this.pos[1] += dy;
    }
  }
  attack() {

  }
}