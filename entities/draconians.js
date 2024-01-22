/* eslint-disable no-undef */
class Draconian extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = "purple") {
    super(_pos, "Draconian", _roomId, _level, Math.floor(Math.pow(_level + 10, 0.8) / 3), 5, 3, 20, 5, Math.floor(Math.sqrt(_level) + 10), "Slashing", 1.2, 700, _collisionMap, _textureSet);

    // Proficient fighters with periodic breath attacks
    this.breathCooldown = 8000;
    this.breathTimer = millis();
    this.breathStall = 1000;
    this.firing = false;
    this.breathEntities = [];
  }

  updateBreathAttack(player, enemies) {
    return this.firing;
  }

  initiateBreathAttack(player, enemies) {
    this.breathTimer = millis();
    this.firing = true;
  }

  combat(player, enemies, time, distance, pursuitVector) {
    this.updateBreathAttack(player, enemies);
    if(millis() - this.breathTimer > this.breathCooldown) {
      this.initiateBreathAttack(player, enemies);
    }
    else if(millis() - this.breathTimer < this.breathStall || this.firing) {
      return;
    }
    else if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3);
      weights.weighMomentum(this.prevDirection);
      weights.weighSocialDistancing(this.pos, enemies);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }

  display(screenCenter, screenSize) {
    this.breathEntities.forEach((b) => {
      b.display(screenCenter, screenSize);
    });
    super.display(screenCenter, screenSize);
  }
}

class BlueDraconian extends Draconian {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.blueDraconianTileSet);

    // Lightning bolts
    this.boltCount = 3;
    this.boltCountRemaining = 0;
    this.boltTimer = millis();
    this.boltCooldown = this.breathStall / (this.boltCount + 1);
    this.boltDuration = 200;
    this.boltTargetPos = [0, 0];
    this.boltRange = 20;
    this.boltWidth = 0.1;
    this.boltDamage = 4 * this.attackDamage;
    this.boltDamageType = "Lightning";
    this.initLightningColour = color(150, 150, 255, 0);
    this.finalLightningColour = color(150, 150, 255, 100);
    this.lightningColour = color(255, 255, 255, 255);
    this.fadeLightningColour = color(0, 0, 255, 0);
  }

  initiateLightning(player) {
    if(this.boltCountRemaining <= 0) {
      this.firing = false;
      return;
    }
    this.boltCountRemaining -= 1;
    this.boltTimer = millis();

    let pos = player.pos; // May be changed later
    let targetLightningDisp = scaleVector(pos, this.boltRange, this.pos);
    this.targetLightningPos = [this.pos[0] + targetLightningDisp[0] + random(-5, 5), this.pos[1] + targetLightningDisp[1] + random(-5, 5)];
    this.breathEntities.push(new LineWarnZone(this.pos, this.targetLightningPos, this.boltWidth, millis(), millis() + this.boltCooldown, millis() + this.boltCooldown + this.boltDuration, this.initLightningColour, this.finalLightningColour, this.lightningColour, this.fadeLightningColour, this.collisionMap));
  }

  fireLightning(player) {
    let d = checkBounds(player.pos[0], player.pos[1],
      this.pos[0], this.pos[1],
      this.targetLightningPos[0], this.targetLightningPos[1]);
    if(d !== -1 && d < this.boltWidth / 2 + player.radius) {
      player.damage(this.boltDamage, this.boltDamageType);
    }
  }

  initiateBreathAttack(player, enemies) {
    super.initiateBreathAttack(player, enemies);
    this.boltCountRemaining = this.boltCount;
    this.initiateLightning(player);
  }

  updateBreathAttack(player, enemies) {
    if(!super.updateBreathAttack(player, enemies)) {
      return false;
    }
    if(millis() - this.boltTimer > this.boltCooldown) {
      this.fireLightning(player);
      this.boltTimer = millis();
      this.initiateLightning(player);
    }
    return true;
  }

  operate(player, enemies, time) {
    super.operate(player, enemies, time);
    this.breathEntities = this.breathEntities.filter((b) => b.isAlive);
    this.breathEntities.filter((b) => {
      b.operate(player, time);
      return b.isAlive;
    });
  }
}

class RedDraconian extends Draconian {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.redDraconianTileSet);

    // Fireball spam
    this.firingAngle = Math.PI / 2;
    this.fireBallDamage = this.attackDamage;
    this.maxFireBalls = 10;
    this.fireBallsFired = this.maxFireBalls;
    this.fireBallCooldown = this.breathStall / this.maxFireBalls;
    this.initFireSpeed = 2;
    this.fireBallRange = 20;
  }

  fireFireBall(player, enemies) {
    let playerDisplacement = scaleVector(player.pos, 1, this.pos);
    let playerDirection = getAngle(playerDisplacement[1], playerDisplacement[0]);
    playerDirection += random(-this.firingAngle / 2, this.firingAngle / 2);
    let firingDisplacement = scaleVector([Math.cos(playerDirection), Math.sin(playerDirection)], this.initFireSpeed);
    enemies.push(new FireBall(this.pos, this.lockedZone, firingDisplacement, this.fireBallRange, this.fireBallDamage, this.collisionMap));
    this.fireBallsFired += 1;
    if(this.fireBallsFired >= this.maxFireBalls) {
      this.firing = false;
    }
  }

  initiateBreathAttack(player, enemies) {
    super.initiateBreathAttack(player, enemies);
    this.fireBallsFired = 0;
  }

  updateBreathAttack(player, enemies) {
    while(this.firing && millis() - this.breathTimer > this.fireBallCooldown * this.fireBallsFired) {
      this.fireFireBall(player, enemies);
    }
    if(!super.updateBreathAttack(player, enemies)) {
      return false;
    }
    return true;
  }
}

class BlackDraconian extends Draconian {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.blackDraconianTileSet);

    // Assassinates the player with malicious balls of death
    this.attackDamage *= 2;
    this.speed *= 1.2;
    this.deathBallCharge = this.breathStall / 2;
    this.deathBallDamage = 3 * this.attackDamage;
    this.deathBallCount = 3;
    this.deathBallWaitTime = 1000;
  }

  updateBreathAttack(player, enemies) {
    if(this.firing && millis() - this.deathBallCharge > 0) {
      enemies.push(new DeathBall(this.pos, this.lockedZone, player,
        this.deathBallDamage, this.deathBallWaitTime, this.deathBallCount,
        this.collisionMap));
      this.firing = false;
    }
    if(!super.updateBreathAttack(player, enemies)) {
      return false;
    }
  }
}

class FireBall extends EnemyProjectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Fire", 0.3, false, 0, 0, null, _collisionMap, textures.fireBallTileSet);
  }

  operate(target, enemies, time) {
    this.speed *= Math.pow(8, time);
    super.operate(target, enemies, time);
  }
}

/**
 * Assassin projectile used by the black draconian. It extends EnemyProjectile
 *   solely for consistency, but many functionalities are changed.
 */
class DeathBall extends EnemyProjectile {
  constructor(_pos, _zone, _player, _hitDmg, _dt, _counts, _collisionMap) {
    super(_pos, _zone, [1, 1], 255, 0, "Force", 0.1, true, 2, _hitDmg, "Neocrotic", _collisionMap, textures.deathBallTextureSet);
    this.initPos = structuredClone(this.pos);
    this.targetPos = structuredClone(_player.pos);
    this.moveTimer = millis();
    this.timeInterval = _dt;
    this.countsRemaining = _counts - 1;
    this.movementHalfLive = 300;
  }

  /**
   * Calculates next positions based on target speed.
   * @param {Player} target The target player.
   */
  setNextPos(target) {
    this.countsRemaining -= 1;
    this.moveTimer = millis();
    this.initPos = structuredClone(this.pos);
    let [i, j] = target.movementDirection;
    let dispMag = this.timeInterval * dist(i, j, 0, 0) / 1000;
    let theta = random(2 * Math.PI);
    this.targetPos = [target.pos[0] + dispMag * Math.cos(theta),
      target.pos[1] + dispMag * Math.cos(theta)];
  }

  /**
   * Complete overhaul of inherited operate function.
   */
  operate(target, enemies, time) {
    if(!this.isAlive) {
      return;
    }
    if(millis() - this.moveTimer >= this.timeInterval) {
      this.explode([target], time);
      if(this.countsRemaining <= 0) {
        this.isAlive = false;
        return;
      }
      this.setNextPos(target);
    }
    else {
      // Weights of initial and final pos, respectively
      let w1 = Math.pow(1/2, (millis() - this.moveTimer) / this.movementHalfLive);
      let w2 = 1 - w1;
      this.pos = [this.initPos[0] * w1 + this.targetPos[0] * w2,
        this.initPos[1] * w1 + this.targetPos[1] * w2];
    }
  }

  /**
   * Totally not copy pasted and slightly modified from phantom dark spells
   */
  explode(targets, time) {
    for(let target of targets) {
      let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
      if(distance < this.explosionRadius) {
        target.damage(this.explosionDamage, this.explosionDamageType);
        player.blindnessTimer = max(player.blindnessTimer, millis() + 2000);
      }
      else if(distance < this.explosionRadius + target.radius) {
        target.damage(this.explosionDamage / 2, this.explosionDamageType);
        player.blindnessTimer = max(player.blindnessTimer, millis() + 1000);
      }
    }
    myDungeon.dungeon[this.lockedZone - 3].enemies.push(new DiskWarnZone(this.pos, this.explosionRadius, 0, millis(), millis() + 1000, color(0,0,0,0), color(0,0,0,0), color(0,0,0,255), color(0,0,0,0), this.collisionMap));
  }
}

const DRACONIANVARIANTS = [BlueDraconian, RedDraconian, BlackDraconian];

function createDraconians(draconianDifficulty) {
  let draconians = [];
  let redVariantChance = 0;
  let blackVariantChance = 0;
  if(draconianDifficulty > 150) {
    redVariantChance = 1;
  }
  if(draconianDifficulty > 250) {
    redVariantChance = 0.5;
  }
  if(draconianDifficulty > 400) {
    blackVariantChance = 0.3;
  }
  while(draconianDifficulty > 0) {
    let draconianType = 0;
    let maxLevel = draconianDifficulty;
    if(random() < blackVariantChance) {
      draconianType = 2;
    }
    else if(random() < redVariantChance) {
      draconianType = 1;
    }
    let chosenLevel = Math.ceil(Math.max(50, random(1, maxLevel)));
    draconians.push([DRACONIANVARIANTS[draconianType], chosenLevel, 0.2]);
    draconianDifficulty -= chosenLevel;
  }
  return draconians;
}