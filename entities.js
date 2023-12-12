class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _animationSet){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.animationSet = _animationSet;
    this.isMoving = 0;
    this.isAlive = true;
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
    scale(1-2*(this.direction[0] === 1), 1);
    image(this.animationSet.animations[this.isMoving+this.direction[1]][Math.floor(frameCount/this.animationSpeed)%this.animationSet.animations[this.isMoving+this.direction[1]].length], x*imgWidth, y*scaleY, scaleX, scaleY);
    scale(1-2*(this.direction[0] === 1), 1);
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
    if(this.health <= 0) {
      this.isAlive = false;
      this.health = 0;
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
    
    // Attack/use cooldowns
    this.attackTimer = millis();
  }
  move(direction, time, isRolling){
    this.movementDirection = [0, 0];
    let [i, j] = direction;
    this.direction[0] = i===0 ? this.direction[0]:i===-1 ? 1:0;
    this.direction[1] = j===0 ? this.direction[1]:j===-1 ? 1:0;
    this.speed = isRolling && this.isMoving !== 5 ? this.rollSpeed : this.defaultSpeed;
    // if(millis() < this.attackTimer) {
    //   this.speed = 20;
    // }
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

class Slime extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(4*Math.log10(_level+1)), 0, 1.5, _collisionMap, _textureSet);
    this.detectionRange = 8; // TEMPORARY
    this.attackRange = 0.5;
    this.attackTimer = millis();
    this.attackCooldown = 600;
    this.attackDamage = 1;
    this.combatBalanceRadius = 0.5;
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
    this.radius = 1;
    this.jumpSplashRadius = this.radius * 1.5;
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(this.jumping) {
      this.jump(player, time);
    }
    else if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
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
      this.jump(player, time, distance);
    }
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 1, 5);
      // Retreat midpoint of -1e9 since slimes don't retreat
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, -1e9);
      weights.weighMomentum(this.prevDirection);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  jump(player, time, d = this.jumpRange) {
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
      this.splash(player, time);
    }
  }
  splash(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    if(distance < this.jumpSplashRadius) {
      console.log("[Slime] Splash attacks!");
      player.damage(3, "Bludgeoning");
    }
  }
  attack(player, time) {
    console.log("[Slime] Attacks.");
    player.damage(1, "Bludgeoning");
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
    super(_pos, _level + 4, 0, 4.5, _collisionMap, _textureSet);
    this.detectionRange = 12;
    this.attackRange = 1;
    this.attackDamage = 3;
    this.combatBalanceRadius = 2;
    this.prevDirection = [0, 0];
    this.draft = true;
    this.draftCol = "chocolate";

    // Goblin bully tactics
    this.thrustRadius = 3;
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

      // Thrust
      if(!this.backing && !this.fleeing && distance < this.thrustRadius && random() < this.thrustChance) {
        this.thrusting = true;
      }
      if(this.thrusting) {
        weights.weighPursuitVector(pursuitVector);
      }

      // Back off or flee
      else if(this.backing || this.fleeing) {
        weights.weighPursuitVector(pursuitVector, -1);
      }
      else {
        weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
        weights.weighTargetDirection(player, 2 / distance);
      }
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time) {
    console.log("[Goblin] Attacks.");
    player.damage(this.attackDamage, "Slashing");
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

class Zombie extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, _collisionMap, _textureSet);
    // Default parameters
    this.detectionRange = 10;
    this.combatBalanceRadius = 1;
    this.prevDirection = [0, 0];
    this.draftCol = "darkolivegreen";
    this.attackRange = 1.5;
    this.attackTimer = millis();
    this.attackCooldown = 700;
    this.attackDamage = 2;
    this.isMoving = 0;
    this.direction = [0, 0];

    // Zombies stop when attacking and bite if close
    this.strafeMultiplier = -1;
    this.biteRadius = 0.7;
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
      this.isMoving = 0;
      this.combat(player, time, distance, pursuitVector);
    }
  }
  combat(player, time, distance, pursuitVector) {
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time, distance);
      this.attackTimer = millis();
    }
    else if(distance > this.biteRadius) {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
      weights.weighMomentum(this.prevDirection);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, 0, this.strafeMultiplier, 20);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time, distance) {
    console.log("[Zombie] Attacks.");
    player.damage(this.attackDamage, "Bludgeoning");
    if(distance <= this.biteRadius) {
      player.damage(this.attackDamage, "Piercing");
      console.log("[Zombie] Bites.");
    }
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

class Skeleton extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(_level + 4), 2, 2.5, _collisionMap, _textureSet);
    // Default parameters
    this.detectionRange = 10;
    this.combatBalanceRadius = 6;
    this.prevDirection = [0, 0];
    this.draft = true;
    this.draftCol = "blanchedalmond";
    this.attackRange = 1.5;
    this.attackTimer = millis();
    this.attackCooldown = 1000;
    this.attackDamage = 1;

    // I am Skeletor.
    this.retreatMidpoint = 4;
    this.throwRange = 8;
    this.throwTimer = millis();
    this.throwCooldown = 5000;
    this.throwStunTime = 1000;
    this.throwSpeed = 10;
    this.throwDamage = 10;
    this.thrownBones = [];
  }
  operate(player, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    if(millis() - this.throwTimer < this.throwStunTime) {
      this.isMoving = 0;
    }
    else if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
      this.isMoving = 1;
      this.combat(player, time, distance, pursuitVector);
    }
    for(let bone of this.thrownBones) {
      bone.operate(player, time);
    }
    this.thrownBones = this.thrownBones.filter((b) => b.isAlive);
  }
  combat(player, time, distance, pursuitVector) {
    if(distance <= this.throwRange && millis() - this.throwTimer > this.throwCooldown) {
      // Throw
      this.throw(player, time, pursuitVector);
      this.throwTimer = millis();
    }
    else if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
      weights.weighMomentum(this.prevDirection);
      // Skeletons keep their distance
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, this.retreatMidpoint);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time) {
    console.log("[Skeleton] Attacks.");
    player.damage(this.attackDamage, "Slashing");
  }
  throw(player, time, pursuitVector) {
    console.log("[Skeleton] Throws a bone.");
    this.thrownBones.push(new Bone(this.pos, scaleVector(pursuitVector, this.throwSpeed), this.throwRange, this.throwDamage, this.collisionMap, ""));
  }
  display(screenCenter, screenSize) {
    super.display(screenCenter, screenSize);
    for(let bone of this.thrownBones) {
      bone.display(screenCenter, screenSize);
    }
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

class Bone extends Entity {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(structuredClone(_pos), 0, 0, 0, _collisionMap, _textureSet);
    this.initPos = structuredClone(this.pos);
    this.dir = _dir;
    this.hitDamage = _hitDmg;
    this.speed = Math.sqrt(_dir[0]*_dir[0] + _dir[1]*_dir[1]);
    this.maxDist = _maxDist;
    this.attackRange = 0.5;
    this.draft = true;
    this.draftCol = "white";
    this.hitTimer = millis();
    this.hitCooldown = 50;
  }

  operate(player, time) {
    this.move(this.dir, time);
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    if(distance < this.attackRange && millis() - this.hitTimer > this.hitCooldown) {
      this.hit(player, time);
      this.hitTimer = millis();
    }
    if(dist(this.pos[0], this.pos[1], this.initPos[0], this.initPos[1]) > this.maxDist) {
      this.isAlive = false;
    }
  }

  hit(player, time) {
    console.log("[Thrown bone] Hitting!");
    player.damage(this.hitDamage, "Piercing");
    this.isAlive = false;
  }

  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0
      && this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
      this.pos[0] += dx;
      this.pos[1] += dy;
    }
    else {
      this.isAlive = false;
    }
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