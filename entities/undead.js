/* eslint-disable no-undef */
class Zombie extends Entity {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, _collisionMap, _textureSet);
    // Default parameters
    this.detectionRange = 10;
    this.combatBalanceRadius = 1;
    this.prevDirection = [0, 0];
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
  operate(player, enemies, time) {
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
  operate(player, enemies, time) {
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
      bone.operate([player], time);
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
    this.thrownBones.push(new Bone(this.pos, scaleVector(pursuitVector, this.throwSpeed), this.throwRange, this.throwDamage, this.collisionMap, "white"));
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

class Bone extends Projectile {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, "Piercing", 0.5, false, 0, 0, null, _collisionMap, _textureSet);
  }
}