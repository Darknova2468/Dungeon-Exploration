/* eslint-disable no-undef */
class Draconian extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = "purple") {
    super(_pos, "Draconian", _roomId, _level, _level + 10, 20, 3, 20, 5, _level, "Slashing", 1.2, 700, _collisionMap, _textureSet);

    // Proficient fighters with periodic breath attacks
    this.breathCooldown = 8000;
    this.breathTimer = millis();
    this.breathStall = 1000;
    this.firing = false;
    this.breathEntities = [];
  }

  updateBreathAttack(player) {
    return this.firing;
  }

  initiateBreathAttack(player) {
    this.breathTimer = millis();
    this.firing = true;
  }

  combat(player, enemies, time, distance, pursuitVector) {
    this.updateBreathAttack(player);
    if(millis() - this.breathTimer > this.breathCooldown) {
      this.initiateBreathAttack(player);
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
    super(_pos, _roomId, _level, _collisionMap, "blue");

    // Lightning bolts
    this.boltCount = 3;
    this.boltCountRemaining = 0;
    this.boltTimer = millis();
    this.boltCooldown = this.breathStall / (this.boltCount + 1);
    this.boltDuration = 200;
    this.boltTargetPos = [0, 0];
    this.boltRange = 20;
    this.boltWidth = 0.1;
    this.boltDamage = 10;
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

  initiateBreathAttack(player) {
    super.initiateBreathAttack(player);
    this.boltCountRemaining = this.boltCount;
    this.initiateLightning(player);
  }

  updateBreathAttack(player) {
    if(!super.updateBreathAttack(player)) {
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
    super(_pos, _roomId, _level, _collisionMap, "red");

    // Fireball spam
    this.fireBallCooldown = 200;
  }
}