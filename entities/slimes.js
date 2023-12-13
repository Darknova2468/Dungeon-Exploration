/* eslint-disable no-undef */
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
      this.animationNum[0] = 0;
      this.idle(time);
    }
    else {
      this.animationNum[0] = 1;
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

class LavaSlime extends Slime {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, _level, _collisionMap, _textureSet);
    this.lavaSlimeBalls = [];
    this.lavaSlimeBallSpeed = 4;
    this.lavaSlimeBallRange = 4;
    this.lavaSlimeBallDamage = 3;
    this.canJump = true;
    this.animationSet = _textureSet;
  }

  jump(player, time, d = this.jumpRange) {
    this.jumpTimer = millis();
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    this.lavaSlimeBalls.push(new LavaSlimeBall(this.pos, scaleVector(pursuitVector, this.lavaSlimeBallSpeed), this.lavaSlimeBallRange, this.lavaSlimeBallDamage, this.collisionMap, "red"));
    console.log("[Lava Slime] Shot a lava slime ball!");
  }

  operate(player, time) {
    super.operate(player, time);
    for(let lavaSlimeBall of this.lavaSlimeBalls) {
      lavaSlimeBall.operate([player], time);
    }
    this.lavaSlimeBalls = this.lavaSlimeBalls.filter((b) => b.isAlive);
  }

  display(screenCenter, screenSize) {
    super.display(screenCenter, screenSize);
    for(let lavaSlimeBall of this.lavaSlimeBalls) {
      lavaSlimeBall.display(screenCenter, screenSize);
    }
  }
}

class LavaSlimeBall extends Projectile {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, "Fire", 0.5, false, 0, 0, null, _collisionMap, _textureSet);
  }
}