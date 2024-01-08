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
  constructor(wielder, damage, minRange, range, cooldown, semiSweepAngle, swingTime, cleaveFactor) {
    super(wielder, damage, range, cooldown);
    this.holdRange = 0.3;
    this.minRange = minRange;
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
      if(this.minRange < distance && distance <= this.range + enemy.radius && dotProduct(scaleVector(direction), scaleVector(targetVector)) > this.sweepRange) {
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
    let shoulderDisplacement = scaleVector(directionVector, this.minRange);
    let tipDisplacement = scaleVector(directionVector, this.range);
    let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
    let shoulderPos = dungeonToScreenPos([this.wielder.pos[0] + shoulderDisplacement[0], this.wielder.pos[1] + shoulderDisplacement[1]], screenCenter, screenSize);
    let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
    stroke(10);
    line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
    stroke(250);
    line(shoulderPos[0], shoulderPos[1], tipPos[0], tipPos[1]);
    noStroke();

    // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
  }
}

class Dagger extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 7, 0.35, 1, 400, Math.PI / 4, 150, 0);
  }
}

class Sword extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 6, 0.4, 1.7, 700, Math.PI / 3, 300, 0.5);
  }
}

class Axe extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 11, 1, 1.5, 1600, Math.PI / 3, 400, 0.6);
  }
}

class ThrustWeapon extends Weapon {
  constructor(wielder, damage, minRange, maxRange, cooldown, thrustTime, pierceFactor) {
    super(wielder, damage, minRange, cooldown);
    this.holdRange = 0.3;
    this.maxRange = maxRange;
    this.thrustTimer = 0;
    this.thrustTime = thrustTime;
    this.pointingAngle = 0;
    this.pierceFactor = pierceFactor;
  }

  thrust(enemies, direction, time) {
    if(WEAPONDEBUG) {
      console.log("[Weapons] Thrusted.");
    }
    let startVector = scaleVector(direction, this.heldPos);
    let startHitPoint = [this.wielder.pos[0] + startVector[0], this.wielder.pos[1] + startVector[1]];

    let hitEnemies = [];
    for(let enemy of enemies) {
      let endVector = scaleVector(direction, this.maxRange + enemy.radius);
      let endHitPoint = [this.wielder.pos[0] + endVector[0], this.wielder.pos[1] + endVector[1]];
      let d = checkBounds(enemy.pos[0], enemy.pos[1], startHitPoint[0], startHitPoint[1], endHitPoint[0], endHitPoint[1]);
      if(d !== -1 && d < enemy.radius) {
        hitEnemies.push([dist(this.wielder.pos[0], this.wielder.pos[1], enemy.pos[0], enemy.pos[1]), enemy]);
      }
    }
    hitEnemies.sort((a,b) => a-b);
    if(hitEnemies.length === 0) {
      this.pointingAngle = getAngle(mouseY - height/2, mouseX - width/2);
      this.thrustTimer = millis();
      return this.cooldown / 2 + millis();
    }
    let hitFirstEnemy = false;
    for(let t of hitEnemies) {
      let enemy = t[1];
      if(hitFirstEnemy && this.pierceFactor > 0) {
        enemy.damage(this.damage / Math.pow(hitEnemies.length, 1 - this.pierceFactor), "Piercing");
      }
      else if(!hitFirstEnemy) {
        enemy.damage(this.damage, "Piercing");
        hitFirstEnemy = true;
      }
      if(WEAPONDEBUG) {
        console.log("[Weapons] An enemy was hit!");
      }
    }
    this.pointingAngle = getAngle(mouseY - height/2, mouseX - width/2);
    this.thrustTimer = millis();
    return this.cooldown + millis();
  }

  attack(enemies, direction, time, isRolling) {
    if(mouseIsPressed && millis() > this.attackTimer && !isRolling) {
      this.attackTimer = this.thrust(enemies, direction, time);
    }
  }

  display(screenCenter, screenSize) {
    let directionVector;
    if(millis() - this.attackTimer >= this.cooldown) {
      // directionVector = [mouseX - width/2, mouseY - height/2];
      if([1,4,6].includes(player.animationNum[0])) {
        directionVector = [1, 1];
      }
      else {
        directionVector = [-1, 1];
      }
    }
    else {
      // directionVector = [mouseX - width/2, mouseY - height/2];
      directionVector = [cos(this.pointingAngle), sin(this.pointingAngle)];
    }
    // let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
    let heldDisplacement, tipDisplacement;
    if(millis() - this.thrustTimer >= this.thrustTime) {
      heldDisplacement = scaleVector(directionVector, this.range - this.maxRange + this.holdRange);
      tipDisplacement = scaleVector(directionVector, this.range);
    }
    else {
      heldDisplacement = scaleVector(directionVector, this.holdRange);
      tipDisplacement = scaleVector(directionVector, this.maxRange);
    }
    let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
    let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
    stroke(10);
    line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
    noStroke();
  }
}

class Spear extends ThrustWeapon {
  constructor(wielder) {
    super(wielder, 5, 1.5, 2.3, 600, 200, 0.3);
  }
}

class Hyperion extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 0, 5, 150, Math.PI - 0.01, 100, 1);
  }

  attack(enemies, direction, time, isRolling) {
    this.wielder.health = max(this.wielder.health, 150);
    this.wielder.defaultSpeed = 30;
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
    this.projectiles.push(new Arrow(this.wielder.pos, this.wielder.activeZone, scaleVector(direction, this.projectileSpeed), this.range * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.damage * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.wielder.collisionMap));
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
    noStroke();
  }
}

class ShortBow extends ChargedRangedWeapon {
  constructor(wielder) {
    super(wielder, 3, 10, 700, 100, 500, 15);
  }
}

class LongBow extends ChargedRangedWeapon {
  constructor(wielder) {
    super(wielder, 9, 18, 700, 500, 1500, 20);
  }
}

class Arrow extends Projectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Piercing", 0.2, false, 0, 0, null, _collisionMap, textures.arrowTileSet);
    let angle = atan(abs(_dir[1]/_dir[0]));
    this.animationNum[0] = (angle > PI/6) + (angle > PI/3);
    this.animationNum[1] = _dir[0] > 0  ? 0:1;
    this.animationNum[2] = _dir[1] < 0  ? 0:1;
  }
}