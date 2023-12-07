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
    this.draft = false; // Should only be true when textures are not implemented
    this.draftCol = "black";
  }
  display(screenCenter, screenSize){
    if(this.draft) { // Remove when all entities are implemented
      this.displayDraft(screenCenter, screenSize);
      return;
    }
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
  displayDraft(screenCenter, screenSize) {
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    x += screenSize[0]*0.5-0.5+(this.direction[0] === 1);
    y += screenSize[1]*0.5-0.5;
    let scaleX = width/screenSize[0];
    let scaleY = height/screenSize[1];
    fill(this.draftCol);
    ellipse((x+0.5)*scaleX, (y+0.5)*scaleX, scaleX*0.75, scaleY*0.75);
  }
}

class Player extends Entity {
  constructor(_pos, _collisionMap, _animationSet){
    super(_pos, 10, 0, 3.5, _collisionMap, _animationSet);
    this.rollSpeed = 5;
    this.defaultSpeed = 3.5;
    this.movementDirection = [0, 0]; // Unrelated to texturing
  }
  move(direction, time, isRolling){
    this.movementDirection = [0, 0];
    let [i, j] = direction;
    this.direction[0] = i===0 ? this.direction[0]:i===-1 ? 1:0;
    this.direction[1] = j===0 ? this.direction[1]:j===-1 ? 1:0;
    this.speed = isRolling && this.isMoving !== 5 ? this.rollSpeed : this.defaultSpeed;
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
      // this.pos[1] += j*distance;
      this.movementDirection[1] = j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      // this.pos[0] += i*distance;
      this.movementDirection[0] = i*distance;
    }
    this.pos[0] += this.movementDirection[0];
    this.pos[1] += this.movementDirection[1];
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

// function weighVector(weights, vec, shaper = (x) => x) {
//   let w;
//   for(let i = 0; i < 8; i++) {
//     w = dotProduct(vec, ENEMY_MOVEMENT_OPTIONS[i]);
//     weights[i] += shaper(w);
//     // console.log(w);
//   }
// }

class Weights {
  constructor() {
    this.resolution = 8; // May be tweaked later
    this.weights = Array(this.resolution).fill(0);
  }

  weighVector(vec, shaper = (x) => x) {
    let w;
    for(let i = 0; i < this.resolution; i++) {
      w = dotProduct(vec, ENEMY_MOVEMENT_OPTIONS[i]);
      this.weights[i] += shaper(w);
      // console.log(w);
    }
  }

  weighPursuitVector(pursuitVector, scaling = 1) {
    this.weighVector(scaleVector(pursuitVector), (x) => scaling * x);
  }

  weighStrafe(pursuitVector, scaling = 1) {
    this.weighVector(scaleVector(pursuitVector), (x) => scaling * (1 - Math.abs(x)));
  }

  weighObstacles(collisionMap, pos, radius = 2, expScaling = 3) {
    for(let i = -radius; i <= radius; i++) {
      for(let j = -radius; j <= radius; j++) {
        let blockX = Math.floor(pos[0]) + j;
        let blockY = Math.floor(pos[1]) + i;
        if(collisionMap[blockY][blockX] === 0) {
          // Centre at the centre of the square
          blockX += 0.5;
          blockY += 0.5;
          let d = dist(blockX, blockY, pos[0], pos[1]);
          this.weighVector(scaleVector([blockX - pos[0], blockY - pos[1]], 1/d**expScaling), (x) => -x);
        }
      }
    }
  }

  weighBalancedApproach(pursuitVector, sigmoidMidpoint, steepness = 1) {
    // Finds the logistic curve
    let f = 1 / (1 + Math.exp(-steepness * (dist(pursuitVector[0], pursuitVector[1], 0, 0) - sigmoidMidpoint)));
    // console.log(f);
    this.weighPursuitVector(pursuitVector, f);
    this.weighStrafe(pursuitVector, 1-f);
  }

  weighTargetDirection(player, scaling) {
    // console.log(player.movementDirection);
    this.weighVector(scaleVector(player.movementDirection, scaling));
  }

  weighMomentum(prevDirection) {
    this.weighVector(scaleVector(prevDirection, 1));
  }

  getMaxDir() {
    return ENEMY_MOVEMENT_OPTIONS[this.weights.indexOf(Math.max(...this.weights))];
  }
}

class Slime extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 1.5, _collisionMap, _textureSet);
    this.detectionRange = 8; // TEMPORARY
    this.attackRange = 0.5;
    this.prevDirection = [0, 0];

    // Jumping variables
    this.canJump = false;
    this.jumping = false;
    this.defaultSpeed = this.speed;
    this.jumpSpeed = 4 * this.speed;
    this.jumpCooldown = 3000;
    this.jumpTime = 700 / this.defaultSpeed;
    this.jumpTimer = millis();
    this.jumpRange = 3;
    this.jumpSplashRadius = this.radius * 1.5;
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(this.jumping) {
      this.jump(time);
    }
    else if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else if(distance > this.attackRange){
      this.isMoving = 1;
      this.combat(player, time, distance, pursuitVector);
    }
  }
  idle(time) {

  }
  combat(player, time, distance, pursuitVector) {
    if(this.canJump && distance <= this.jumpRange
      && millis() - this.jumpTimer > this.jumpCooldown) {
      // Jump
      this.jump(time, distance);
    }
    if(distance <= this.attackRange) {
      // Attack
      this.attack(player, time);
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 1, 5);
      weights.weighPursuitVector(pursuitVector);
      weights.weighMomentum(this.prevDirection);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  jump(time, d = this.jumpRange) {
    if(!this.jumping) {
      this.jumpTimer = millis() + this.jumpTime * (d / this.jumpRange);
      this.jumping = true;
      this.speed = this.jumpSpeed;
    }
    if(millis() < this.jumpTimer) {
      this.move(this.prevDirection, time);
    }
    else {
      this.jumping = false;
      this.speed = this.defaultSpeed;
      this.splash(time);
    }
  }
  splash(time) {

  }
  attack(player, time) {

  }
  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
      this.pos[0] += dx;
    }
    if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
      this.pos[1] += dy;
    }
  }
}

class Goblin extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 4.5, _collisionMap, _textureSet);
    this.detectionRange = 12;
    this.attackRange = 1;
    this.combatBalanceRadius = 2;
    this.prevDirection = [0, 0];
    this.draft = true;
    this.draftCol = "brown";

    // Goblin bully tactics
    this.thrusting = false;
    this.backing = false;
    this.fleeing = false;
    this.thrustChance = 0.02;
    this.attackTimer = millis();
    this.attackCooldown = 700;
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
      this.isMoving = 1;
      this.combat(player, time, distance, pursuitVector);
    }
  }
  combat(player, time, distance, pursuitVector) {
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.thrusting = false;
      this.backing = true;
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3);
      weights.weighMomentum(this.prevDirection);
      if(distance > this.combatBalanceRadius) {
        this.backing = false;
      }
      if(!this.backing && !this.fleeing && distance < this.combatBalanceRadius && random() < this.thrustChance) {
        this.thrusting = true;
      }
      if(this.thrusting) {
        weights.weighPursuitVector(pursuitVector);
      }
      else if(this.backing || this.fleeing) {
        weights.weighPursuitVector(pursuitVector, -1);
      }
      else {
        weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, 0.7);
        weights.weighTargetDirection(player, 2 / distance);
      }
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time) {

  }
  idle(time) {
    this.thrusting = false;
    this.backing = false;
    this.fleeing = false;
  } 
  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
      this.pos[0] += dx;
    }
    if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
      this.pos[1] += dy;
    }
  }
}

