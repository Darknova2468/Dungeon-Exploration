/* eslint-disable no-undef */
class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _animationSet){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.animationSet = _animationSet;
    this.animationNum = [0, 0];
    this.isAlive = true;
    this.animationSpeed = 4;
    this.invincible = false;
  }
  display(screenCenter, screenSize){
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    let scaleX = width/screenSize[0];
    let scaleY = height/screenSize[1];
    try{
      x += screenSize[0]*0.5-0.5+(this.animationNum[1] === 1);
      y += screenSize[1]*0.5-0.5;
      let imgWidth = this.animationNum[1] === 0 ? scaleX: -scaleX;
      scale(1-2*(this.animationNum[1] === 1), 1);
      image(this.animationSet.animations[this.animationNum[0]][Math.floor(frameCount/this.animationSpeed)%this.animationSet.animations[this.animationNum[0]].length], x*imgWidth, y*scaleY, scaleX, scaleY);
      scale(1-2*(this.animationNum[1] === 1), 1);
    }
    catch{
      fill(this.animationSet);
      circle(x*scaleX, y*scaleY, scaleX*0.8);
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
  damage(amountDamage, damageType) {
    // damageType unused for now
    amountDamage *= 5/(this.defence + 5);
    this.health -= amountDamage;
    if(this.health <= 0 && !this.invincible) {
      this.isAlive = false;
      this.health = 0;
    }
  }
}

class Enemy extends Entity {
  constructor(_pos, _name, _level, _health, _defence, _speed, _detectionRange, _combatBalanceRadius, _attackDamage, _attackDamageType, _attackRange, _attackCooldown, _collisionMap, _textureSet) {
    super(_pos, _health, _defence, _speed, _collisionMap, _textureSet);
    this.name = _name;
    // Default parameters
    this.level = _level;
    this.detectionRange = _detectionRange;
    this.combatBalanceRadius = _combatBalanceRadius;
    this.attackDamage = _attackDamage;
    this.attackDamageType = _attackDamageType;
    this.attackRange = _attackRange;
    this.attackTimer = millis();
    this.attackCooldown = _attackCooldown;
    this.prevDirection = [0, 0];
  }

  operate(player, enemies, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
      this.isMoving = 1;
      this.combat(player, enemies, time, distance, pursuitVector);
    }
  }
  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3);
      weights.weighMomentum(this.prevDirection);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time) {
    console.log(`[${this.name}] Attacks.`);
    player.damage(this.attackDamage, this.attackDamageType);
  }
  idle(time) {

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

class Player extends Entity {
  constructor(_pos, _collisionMap, _animationSet){
    super(_pos, 20, 5, 3.5, _collisionMap, _animationSet);
    this.rollSpeed = 5;
    this.defaultSpeed = 3.5;
    this.movementDirection = [0, 0]; // Unrelated to texturing
    this.holding = new Sword(this);
    this.invincible = true;
    
    // Attack/use cooldowns
    this.attackTimer = millis();
  }
  move(direction, time, isRolling){
    this.movementDirection = [0, 0];
    let [i, j] = direction;
    this.speed = isRolling && j !== 0 || i !== 0 ? this.rollSpeed : this.defaultSpeed;
    
    //animation
    this.animationNum[1] = (i === -1)*1;
    this.animationNum[0] = i === 0 && j === 0 ? 7: isRolling? 3:i === 0 ? 5:0; 
    this.animationNum[0] += j === -1;

    //player movement
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    if(this.collisionMap[Math.floor(this.pos[1]+j*distance)][Math.floor(this.pos[0])] !== 0){
      this.movementDirection[1] = j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      this.movementDirection[0] = i*distance;
    }
    this.pos[0] += this.movementDirection[0];
    this.pos[1] += this.movementDirection[1];
  }

  attack(enemies, time) {
    if(mouseIsPressed && millis() > this.attackTimer) {
      // Temporary direction checking; change later
      let targetVector = [mouseX - width/2, mouseY - height/2];
      this.attackTimer = this.holding.attack(enemies, targetVector, time);
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

  weighBalancedApproach(pursuitVector, pursuitMidpoint, retreatMidpoint = 0, strafeMultiplier = 1, steepness = 0.7) {
    // Finds the pursuit logistic curve
    let pursuitPortion = 1 / (1 + Math.exp(-steepness * (dist(pursuitVector[0], pursuitVector[1], 0, 0) - pursuitMidpoint)));

    // Finds the retreat logistic curve
    let retreatPortion = 1 - 1 / (1 + Math.exp(-steepness * (dist(pursuitVector[0], pursuitVector[1], 0, 0) - retreatMidpoint)));
    // console.log(f);
    this.weighPursuitVector(pursuitVector, pursuitPortion);
    this.weighPursuitVector(pursuitVector, -retreatPortion);
    this.weighStrafe(pursuitVector, strafeMultiplier * (1-pursuitPortion - retreatPortion));
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

// For personal reference
// class Enemy extends Entity {
//   constructor(_pos, _level, _collisionMap, _textureSet) {
//     super(_pos, Math.floor(<Health>), <Defense>, <Speed>, _collisionMap, _textureSet);
//     // Default parameters
//     this.detectionRange = <Detection range>;
//     this.combatBalanceRadius = <Preferred combat distance>;
//     this.prevDirection = [0, 0];
//     this.draft = true;
//     this.draftCol = "<Insert colour here>";
//     this.attackRange = <Attack range>;
//     this.attackTimer = millis();
//     this.attackCooldown = 700;

//     // Characteristic AI variables here
//   }
//   operate(player, time) {
//     let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
//     let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
//     if(distance > this.detectionRange) {
//       this.isMoving = 0;
//       this.idle(time);
//     }
//     else {
//       this.isMoving = 1;
//       this.combat(player, time, distance, pursuitVector);
//     }
//   }
//   combat(player, time, distance, pursuitVector) {
//     if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
//       // Attack
//       this.attack(player, time);
//       this.attackTimer = millis();
//     }
//     else {
//       // Chase
//       let weights = new Weights();
//       weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
//       weights.weighMomentum(this.prevDirection);
//       weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
//       let maxDir = weights.getMaxDir();
//       this.prevDirection = maxDir;
//       this.move(maxDir, time);
//     }
//   }
//   attack(player, time) {
//     console.log("[<Insert enemy name here> Attacks.]");
//   }
//   idle(time) {

//   } 
//   move(pos, time){
//     let [dx, dy] = scaleVector(pos, this.speed * time);
//     if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0){
//       this.pos[0] += dx;
//     }
//     if(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
//       this.pos[1] += dy;
//     }
//   }
// }