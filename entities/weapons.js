/* eslint-disable no-undef */

const WEAPONDEBUG = 0;
const WEAPONS = ["Dagger", "Sword", "Axe", "Spear", "Shortbow", "Longbow"];
const WEAPONCOSTS = [
  [0, 100, 300, 800, 2000],
  [80, 200, 700, 1200, 2800],
  [80, 150, 500, 1000, 2500],
  [80, 150, 500, 1000, 2500],
  [80, 150, 500, 1200, 2500],
  [80, 200, 700, 1000, 2800]];

// const WEAPONCOSTS = [
//   [0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0]];

const WEAPONDAMAGE = [
  [1, 3, 7, 15, 21],
  [2, 5, 10, 19, 26],
  [3, 7, 15, 29, 40],
  [2, 6, 12, 21, 29],
  [1, 2, 4, 7, 14],
  [2, 6, 12, 21, 29],
  [10]];

class Weapon extends Item {
  constructor(name, id, wielder, range, cooldown, animationSet, tileSet, scaleFactor) {
    super(name, wielder, animationSet, tileSet, scaleFactor);
    this.damage = 0;
    this.range = range;
    this.cooldown = cooldown;
    this.attackTimer = 0;
    this.tier = 1;
    this.stackable = false;
    this.weaponId = id;
  }

  attack(enemies, direction, time, isRolling) {
    this.damage = WEAPONDAMAGE[this.weaponId][this.tier - 1];
  }

  updateTileNumber() {
    this.tileNumber = this.tier - 1;
  }
}

class SweepWeapon extends Weapon {
  constructor(name, id, wielder, minRange, range, cooldown, semiSweepAngle, swingTime, cleaveFactor, animationSet, tileSet, scaleFactor) {
    super(name, id, wielder, range, cooldown, animationSet, tileSet, scaleFactor);
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
        if(enemy.passive) {
          continue;
        }
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
    super.attack(enemies, direction, time, isRolling);
    if(mouseIsPressed && millis() > this.attackTimer && !isRolling) {
      this.attackTimer = this.swing(enemies, direction, time);
    }
  }

  displayHeld(screenCenter, screenSize) {
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
    try {
      push();
      imageMode(CENTER);
      let imgScaleX = width/(screenSize[0]*baseResolution[0]/this.animationSet.size[0])*this.scaleFactor;
      let imgScaleY = height/(screenSize[1]*baseResolution[1]/this.animationSet.size[1])*this.scaleFactor;
      let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
      translate(basePos[0], basePos[1]);
      // Modified angle formula for p5 rotations
      let angle;
      if(!this.clockwise) {
        scale(-1, 1);
        angle = getAngle(-directionVector[0], -directionVector[1]);
      }
      else {
        angle = getAngle(directionVector[0], -directionVector[1]);
      }
      rotate(angle);
      image(this.animationSet.animations[this.tier - 1][0], 0, 0, imgScaleX, imgScaleY);
      pop();
    }
    catch {
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
    }

    // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
  }
}

class Dagger extends SweepWeapon {
  constructor(wielder) {
    super("Dagger", 0, wielder, 0.35, 1, 400, Math.PI / 4, 150, 0, textures.daggerAnimationSet, textures.daggerTileSet);
    this.tileScaleFactor = 2;
  }

  attack(enemies, direction, time, isRolling) {
    this.cooldown = 500 - 60 * this.tier;
    super.attack(enemies, direction, time, isRolling);
  }
}

class Sword extends SweepWeapon {
  constructor(wielder) {
    super("Sword", 1, wielder, 0.4, 1.5, 700, Math.PI / 3, 300, 0.5, textures.swordAnimationSet, textures.swordTileSet);
    this.tileScaleFactor = 2;
  }

  attack(enemies, direction, time, isRolling) {
    this.cooldown = 800 - 60 * this.tier;
    this.cleaveFactor = 0.3 + 0.06 * this.tier;
    super.attack(enemies, direction, time, isRolling);
  }
}

class Axe extends SweepWeapon {
  constructor(wielder) {
    super("Axe", 2, wielder, 0.825, 1.25, 1600, Math.PI / 3, 400, 0.6, textures.axeAnimationSet, textures.axeTileSet);
    this.tileScaleFactor = 2;
  }

  attack(enemies, direction, time, isRolling) {
    this.cleaveFactor = 0.4 + 0.12 * this.tier;
    super.attack(enemies, direction, time, isRolling);
  }
}

class ThrustWeapon extends Weapon {
  constructor(name, id, wielder, minRange, maxRange, cooldown, thrustTime, pierceFactor, animationSet, tileSet, scaleFactor) {
    super(name, id, wielder, minRange, cooldown, animationSet, tileSet, scaleFactor);
    this.holdRange = 0.3;
    this.maxRange = maxRange;
    this.thrustTimer = 0;
    this.thrustTime = thrustTime;
    this.pointingAngle = 0;
    this.pierceFactor = pierceFactor;
    this.draft = false;
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
        if(enemy.passive) {
          continue;
        }
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
    super.attack(enemies, direction, time, isRolling);
    if(mouseIsPressed && millis() > this.attackTimer && !isRolling) {
      this.attackTimer = this.thrust(enemies, direction, time);
    }
  }

  displayHeld(screenCenter, screenSize) {
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
    try {
      push();
      imageMode(CENTER);
      let imgScaleX = width/(screenSize[0]*baseResolution[0]/this.animationSet.size[0])*this.scaleFactor;
      let imgScaleY = height/(screenSize[1]*baseResolution[1]/this.animationSet.size[1])*this.scaleFactor;
      let basePos;
      if(millis() - this.thrustTimer >= this.thrustTime) {
        basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
      } 
      else {
        let disp = scaleVector(directionVector, this.maxRange - this.range);
        basePos = dungeonToScreenPos([this.wielder.pos[0] + disp[0], this.wielder.pos[1] + disp[1]], screenCenter, screenSize);
      }
      translate(basePos[0], basePos[1]);
      // Modified angle formula for p5 rotations
      let angle = getAngle(directionVector[0], -directionVector[1]);
      rotate(angle);
      image(this.animationSet.animations[this.tier-1][0], 0, 0, imgScaleX, imgScaleY);
      pop();
    }
    catch {
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
}

class Spear extends ThrustWeapon {
  constructor(wielder) {
    super("Spear", 3, wielder, 1.5, 2.3, 600, 100, 0.3, textures.spearAnimationSet, textures.spearTileSet);
    this.tileScaleFactor = 1.5;
  }

  attack(enemies, direction, time, isRolling) {
    this.cooldown = 800 - 60 * this.tier;
    this.pierceFactor = 0.3 + 0.1 * this.tier;
    super.attack(enemies, direction, time, isRolling);
  }
}

class Hyperion extends SweepWeapon {
  constructor(wielder) {
    super("Hyperion", 6, wielder, 0, 5, 150, Math.PI - 0.01, 100, 1, "");
    this.lightValue = 20;
  }

  attack(enemies, direction, time, isRolling) {
    this.wielder.health = max(this.wielder.health, 150);
    this.wielder.defaultSpeed = 30;
    return super.attack(enemies, direction, time, isRolling);
  }
}

class ChargedRangedWeapon extends Weapon {
  constructor(name, id, wielder, range, cooldown, minChargeTime, chargeTime, projectileSpeed, animationSet, tileSet, scaleFactor) {
    super(name, id, wielder, range, cooldown, animationSet, tileSet, scaleFactor);
    this.minChargeTime = minChargeTime;
    this.chargeTime = chargeTime;
    this.charging = false;
    this.holdRange = 0.3;
    this.chargeTimer = 0;
    this.projectileSpeed = projectileSpeed;
    this.projectiles = [];
    this.animationNum = 0;
    this.animationSet = animationSet;
  }

  fire(direction) {
    if(millis() - this.chargeTimer < this.minChargeTime) {
      return;
    }
    this.projectiles.push(new Arrow(this.wielder.pos, this.wielder.activeZone, scaleVector(direction, this.projectileSpeed), this.range * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.damage * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime), this.wielder.collisionMap));
    // console.log(this.range * Math.min(1, (millis() - this.chargeTimer) / this.chargeTime));
  }

  attack(enemies, direction, time, isRolling) {
    super.attack(enemies, direction, time, isRolling);
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

  displayHeld(screenCenter, screenSize) {
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
    try {
      push();
      imageMode(CENTER);
      let imgScaleX = width/(screenSize[0]*baseResolution[0]/this.animationSet.size[0])*this.scaleFactor;
      let imgScaleY = height/(screenSize[1]*baseResolution[1]/this.animationSet.size[1])*this.scaleFactor;
      let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
      translate(basePos[0], basePos[1]);
      // Modified angle formula for p5 rotations
      let angle = getAngle(directionVector[0], -directionVector[1]);
      rotate(angle);
      this.animationNum = 0;
      if(this.charging){
        this.animationNum = Math.round((millis()-this.chargeTimer)/this.chargeTime*this.animationSet.animations[0].length);
        if(this.animationNum > this.animationSet.animations[0].length-1){
          this.animationNum = this.animationSet.animations[0].length-1;
        }
      }
      image(this.animationSet.animations[this.tier-1][this.animationNum], 0, 0, imgScaleX, imgScaleY);
      pop();
    }
    catch {
      let heldDisplacement = scaleVector(directionVector, this.holdRange);
      let tipDisplacement = scaleVector(directionVector, this.holdRange * 3);
      let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
      let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
      stroke(10);
      line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
      // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
      noStroke();
    }
    this.projectiles.forEach((x) => x.display(screenCenter, screenSize));
  }
}

class ShortBow extends ChargedRangedWeapon {
  constructor(wielder) {
    super("Shortbow", 4, wielder, 10, 700, 100, 400, 15, textures.shortBowAnimationSet, textures.shortBowTileSet);
    this.tileScaleFactor = 2.5;
  }
  
  attack(enemies, direction, time, isRolling) {
    this.chargeTime = 1000 - 150 * this.tier;
    super.attack(enemies, direction, time, isRolling);
    if(mouseIsPressed && millis() - this.chargeTimer > this.chargeTime && !isRolling && this.charging) {
      // Auto-fire
      this.charging = false;
      this.fire(direction);
    }
  }
}

class LongBow extends ChargedRangedWeapon {
  constructor(wielder) {
    super("Longbow", 5, wielder, 18, 700, 500, 1500, 20, textures.longBowAnimationSet, textures.longBowTileSet);
    this.tileScaleFactor = 2.5;
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

const WEAPONCLASSES = [Dagger, Sword, Axe, Spear, ShortBow, LongBow];