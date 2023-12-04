class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _animationSet){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.animationSet = _animationSet;
    this.isMoving = 0;
    this.direction = [0, 0];
    this.animationSpeed = 4;
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
      console.log(Math.floor(frameCount/this.animationSpeed)%this.animationSet.animations[this.isMoving+this.direction[1]].length);
      console.log(this.animationSet.animations[this.isMoving+this.direction[1]]);
      fill(this.animationSet);
      ellipse((x+0.5)*scaleX, (y+0.5)*scaleX, scaleX*0.75, scaleY*0.75);
    }
  }
}

class Player extends Entity {
  constructor(_pos, _collisionMap, _animationSet){
    super(_pos, 10, 0, 3.5, _collisionMap, _animationSet);
  }
  move(direction, time, isRolling){
    let [i, j] = direction;
    this.direction[0] = i===0 ? this.direction[0]:i===-1 ? 1:0;
    this.direction[1] = j===0 ? this.direction[1]:j===-1 ? 1:0;
    this.speed = isRolling && this.isMoving !== 5 ? 5:3.5;
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    if(i === 0 && j !== 0 && !isRolling){
      this.isMoving = 5;
      if(j > 1){
        this.direction[1] = 1;
      }
    }
    else {
      this.isMoving = i === 0 && j === 0 ? 7:0;
      this.isMoving = isRolling && this.isMoving !== 7 ? 3:this.isMoving;
    }
    if(this.collisionMap[Math.floor(this.pos[1]+j*distance)][Math.floor(this.pos[0])] !== 0){
      this.pos[1] += j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      this.pos[0] += i*distance;
    }
  }
}

const DIAGNORM = 0.70710678118;

const ENEMY_MOVEMENT_OPTIONS = [[1,0], [DIAGNORM,DIAGNORM], [0,1], [-DIAGNORM,DIAGNORM],
  [-1,0], [-DIAGNORM,-DIAGNORM], [0,-1], [DIAGNORM,-DIAGNORM]];

function dotProduct(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function scaleVector(a, mag = 1, b = [0,0]) {
  let d = dist(b[0], b[1], a[0], a[1]);
  if(d === 0) {
    return [0, 0];
  }
  return [mag * (a[0] - b[0]) / d, mag * (a[1] - b[1]) / d];
}

function weighVector(weights, vec, shaper = (x) => x) {
  let w;
  for(let i = 0; i < 8; i++) {
    w = dotProduct(vec, ENEMY_MOVEMENT_OPTIONS[i]);
    weights[i] += shaper(w);
    // console.log(w);
  }
}

class Slime extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 3, _collisionMap, _textureSet);
    this.detectionRange = 60;
    this.attackRange = 1;
    this.prevDirection = [0, 0];
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    let weights = Array(8).fill(0);
    if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle();
      return;
    }
    else if(distance > this.attackRange){
      this.isMoving = 1;
      // for(let i = 0; i < 8; i++) {
      //   w = dotProduct(scaleVector(pursuitVector), enemy_movement_options[i]);
      //   weights[i] += w;
      //   console.log(w);
      // }
      weighVector(weights, scaleVector(pursuitVector));
      for(let i = -2; i <= 2; i++) {
        for(let j = -2; j <= 2; j++) {
          let blockX = Math.floor(this.pos[0]) + j;
          let blockY = Math.floor(this.pos[1]) + i;
          if(this.collisionMap[blockY][blockX] === 0) {
            blockX += 0.5;
            blockY += 0.5;
            let d = dist(blockX, blockY, this.pos[0], this.pos[1]);
            weighVector(weights, scaleVector([blockX - this.pos[0], blockY - this.pos[1]], 1/d**3), (x) => -x);
          }
        }
      }
      weighVector(weights, scaleVector(this.prevDirection, 1));
      let maxDir = ENEMY_MOVEMENT_OPTIONS[weights.indexOf(Math.max(...weights))];
      this.prevDirection = maxDir;
      this.move(maxDir, time);

      // this.move(player.pos, time);
    }
    else {
      this.isMoving = 0;
      this.attack();
    }
  }
  idle() {

  }
  // move(pos, time){
  //   let mag = dist(pos[0], pos[1], this.pos[0], this.pos[1]);
  //   let dx = (pos[0]-this.pos[0])/mag*this.speed*time;
  //   let dy = (pos[1]-this.pos[1])/mag*this.speed*time;
  //   if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
  //     this.pos[0] += dx;
  //   }
  //   if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
  //     this.pos[1] += dy;
  //   }
  // }
  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
      this.pos[0] += dx;
    }
    if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
      this.pos[1] += dy;
    }
  }
  moveTo(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time, this.pos);
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