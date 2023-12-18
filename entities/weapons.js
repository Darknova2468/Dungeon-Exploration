/* eslint-disable no-undef */

const WEAPONDEBUG = 0;

class HeldItem {
  constructor(_wielder) {
    this.wielder = _wielder;
  }

  display(screenCenter, screenSize) {}
}

class Weapon extends HeldItem {
  constructor(wielder, damage, range, cooldown) {
    super(wielder);
    this.damage = damage;
    this.range = range;
    this.cooldown = cooldown;
    this.attackTimer = 0;
  }

  attack(enemies, direction, time, isRolling) {}
}

class SweepWeapon extends Weapon {
  constructor(wielder, damage, range, cooldown, semiSweepAngle, swingTime, cleaveFactor) {
    super(wielder, damage, range, cooldown);
    this.holdRange = 0.3;
    this.semiSweepAngle = semiSweepAngle;
    this.sweepRange = cos(this.semiSweepAngle);
    this.swingTimer = 0;
    this.swingTime = swingTime;
    this.pointingAngle = 0;
    this.cleaveFactor = cleaveFactor;
    this.clockwise = false;
  }

  swing(enemies, direction, time) {
    if(WEAPONDEBUG) {
      console.log("[Weapons] Swung.");
    }
    this.clockwise = !this.clockwise;
    let hitEnemies = [];
    for(let enemy of enemies) {
      let distance = dist(enemy.pos[0], enemy.pos[1], this.wielder.pos[0], this.wielder.pos[1]);
      let targetVector = [enemy.pos[0] - this.wielder.pos[0], enemy.pos[1] - this.wielder.pos[1]];
      if(this.holdRange < distance && distance <= this.range && dotProduct(scaleVector(direction), scaleVector(targetVector)) > this.sweepRange) {
        hitEnemies.push(enemy);
      }
    }
    if(hitEnemies.length === 0) {
      this.pointingAngle = getAngle(mouseY - height/2, mouseX - width/2);
      this.swingTimer = millis();
      return this.cooldown / 2 + millis();
    }
    let hitFirstEnemy = false;
    for(let enemy of hitEnemies) {
      if(hitFirstEnemy && this.cleaveFactor > 0) {
        enemy.damage(this.damage / Math.pow(hitEnemies.length, 1 - this.cleaveFactor), "Slashing");
      }
      else if(!hitFirstEnemy) {
        enemy.damage(this.damage, "Slashing");
        hitFirstEnemy = true;
      }
      if(WEAPONDEBUG) {
        console.log("[Weapons] An enemy was hit!");
      }
      // console.log(dotProduct(scaleVector(direction), scaleVector(targetVector)));
    }
    this.pointingAngle = getAngle(mouseY - height/2, mouseX - width/2);
    this.swingTimer = millis();
    return this.cooldown + millis();
  }

  attack(enemies, direction, time, isRolling) {
    if(mouseIsPressed && millis() > this.attackTimer && !isRolling) {
      this.attackTimer = this.swing(enemies, direction, time);
    }
  }

  display(screenCenter, screenSize) {
    let directionVector;
    if(millis() - this.swingTimer >= this.swingTime) {
      // directionVector = [mouseX - width/2, mouseY - height/2];
      if([1,4,6].includes(player.animationNum[0])) {
        directionVector = [1, 1];
      }
      else {
        directionVector = [-1, 1];
      }
    }
    else {
      let currentAngle = map(millis(), this.swingTimer, this.swingTimer + this.swingTime, -this.semiSweepAngle * (2 * this.clockwise - 1) + this.pointingAngle, this.semiSweepAngle * (2 * this.clockwise - 1) + this.pointingAngle);
      directionVector = [cos(currentAngle), sin(currentAngle)];
    }
    // let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
    let heldDisplacement = scaleVector(directionVector, this.holdRange);
    let tipDisplacement = scaleVector(directionVector, this.range);
    let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
    let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
    stroke(10);
    line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
    // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
  }
}

class Sword extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 1.5, 700, Math.PI / 3, 200, 0.3);
  }
}

class Hyperion extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 5, 150, Math.PI - 0.01, 100, 1);
  }

  attack(enemies, direction, time, isRolling) {
    this.wielder.health = max(this.wielder.health, 150);
    return super.attack(enemies, direction, time, isRolling);
  }
}

class ChargedRangedWeapon extends Weapon {
  constructor(wielder, damage, range, cooldown, minChargeTime, chargeTime, projectileSpeed) {
    super(wielder, damage, range, cooldown);
    this.minChargeTime = minChargeTime;
    this.chargeTime = chargeTime;
    this.charging = false;
    this.holdRange = 0.3;
    this.chargeTimer = 0;
    this.projectileSpeed = projectileSpeed;
    this.projectiles = [];
  }

  fire(direction) {
    if(millis() - this.chargeTimer < this.minChargeTime) {
      return;
    }
    this.projectiles.push(new Arrow(this.wielder.pos, scaleVector(direction, this.projectileSpeed), this.range * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.damage * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.wielder.collisionMap, "white"));
    // console.log(this.range * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime));
  }

  attack(enemies, direction, time, isRolling) {
    if(mouseIsPressed && millis() > this.attackTimer && !isRolling && !this.charging) {
      this.charging = true;
      this.chargeTimer = millis();
    }
    else if(isRolling) {
      this.charging = false;
    }
    else if(this.charging && !mouseIsPressed) {
      this.charging = false;
      this.fire(direction);
    }
    this.projectiles.forEach((x) => x.operate(enemies, time));
    this.projectiles = this.projectiles.filter((x) => x.isAlive);
  }

  display(screenCenter, screenSize) {
    let directionVector;
    if(!this.charging) {
      // directionVector = [mouseX - width/2, mouseY - height/2];
      if([1,4,6].includes(player.animationNum[0])) {
        directionVector = [1, 1];
      }
      else {
        directionVector = [-1, 1];
      }
    }
    else {
      directionVector = [mouseX - width/2, mouseY - height/2];
    }
    // let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
    let heldDisplacement = scaleVector(directionVector, this.holdRange);
    let tipDisplacement = scaleVector(directionVector, this.holdRange * 3);
    let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
    let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
    stroke(10);
    line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
    // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
    this.projectiles.forEach((x) => x.display(screenCenter, screenSize));
  }
}

class Bow extends ChargedRangedWeapon {
  constructor(wielder) {
    super(wielder, 5, 10, 700, 300, 1000, 15);
  }
}

class Arrow extends Projectile {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, "Piercing", 0.2, false, 0, 0, null, _collisionMap, _textureSet);
  }
}