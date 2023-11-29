class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _colour, _animationSet){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.colour = _colour;
    this.animationSet = _animationSet;
    this.isMoving = null;
    this.direction = [0, 0];
    this.animationSpeed = frameRate()/10;
  }
  display(screenCenter, screenSize){
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    x += screenSize[0]*0.5-0.5+(this.direction[0] === 1);
    y += screenSize[1]*0.5-0.5;
    let scaleX = width/screenSize[0];
    let scaleY = height/screenSize[1];
    let imgWidth = this.direction[0] === 0 ? scaleX: -scaleX;
    try{
      scale(1-2*(this.direction[0] === 1), 1);
      image(this.animationSet.animations[this.isMoving+this.direction[1]][Math.floor(frameCount/this.animationSpeed)%this.animationSet.animations[this.isMoving+this.direction[1]].length], x*imgWidth, y*scaleY, scaleX, scaleY);
      scale(1-2*(this.direction[0] === 1), 1);
    }
    catch {
      fill(this.colour);
      ellipse((x+0.5)*scaleX, (y+0.5)*scaleX, scaleX*0.75, scaleY*0.75);
    }
  }
  setAnimationSpeed(frameRate){
    this.animationSpeed = frameRate/10;
  }
}

class Player extends Entity {
  constructor(_pos, _collisionMap, _animationSet){
    super(_pos, 10, 0, 3.5, _collisionMap, color(255,255,255), _animationSet);
  }
  move(direction, time, isRolling){
    let [i, j] = direction;
    this.direction[0] = i===0 ? this.direction[0]:i===-1 ? 1:0;
    this.direction[1] = j===0 ? this.direction[1]:j===-1 ? 1:0;
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    this.isMoving = i === 0 && j === 0 ? 5:0;
    this.isMoving = isRolling && this.isMoving !== 5 ? 3:this.isMoving;
    this.speed = isRolling && this.isMoving !== 5 ? 5:3.5;
    if(this.collisionMap[Math.floor(this.pos[1]+j*distance)][Math.floor(this.pos[0])] !== 0){
      this.pos[1] += j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      this.pos[0] += i*distance;
    }
  }
}

class Slime extends Entity {
  constructor(_pos, _level, _collisionMap) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 0, _collisionMap, "green", "slime");
    this.detectionRange = 10;
    this.attackRange = 2;
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