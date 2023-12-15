/* eslint-disable no-undef */

const WEAPONDEBUG = 0;

class HeldItem {
  constructor(_wielder) {
    this.wielder = _wielder;
  }

  display(screenCenter, screenSize) {}
}

class MeleeWeapon extends HeldItem {
  constructor(wielder, damage, range, delay) {
    super(wielder);
    this.damage = damage;
    this.range = range;
    this.delay = delay;
  }

  attack(enemies, direction, time) {}
}

class SweepWeapon extends MeleeWeapon {
  constructor(wielder, damage, range, delay, semiSweepAngle, swingTime) {
    super(wielder, damage, range, delay);
    this.holdRange = 0.3;
    this.semiSweepAngle = semiSweepAngle;
    this.sweepRange = cos(this.semiSweepAngle);
    this.swingTimer = 0;
    this.swingTime = swingTime;
    this.pointingAngle = 0;
  }

  attack(enemies, direction, time) {
    if(WEAPONDEBUG) {
      console.log("[Weapons] Swung.");
    }
    for(let enemy of enemies) {
      let distance = dist(enemy.pos[0], enemy.pos[1], this.wielder.pos[0], this.wielder.pos[1]);
      let targetVector = [enemy.pos[0] - this.wielder.pos[0], enemy.pos[1] - this.wielder.pos[1]];
      if(this.holdRange < distance && distance <= this.range && dotProduct(scaleVector(direction), scaleVector(targetVector)) > this.sweepRange) {
        enemy.damage(this.damage, "Slashing");
        if(WEAPONDEBUG) {
          console.log("[Weapons] An enemy was hit!");
        }
      }
      // console.log(dotProduct(scaleVector(direction), scaleVector(targetVector)));
    }
    this.pointingAngle = getAngle(mouseY - height/2, mouseX - width/2);
    this.swingTimer = millis();
    return this.delay + millis();
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
      let currentAngle = map(millis(), this.swingTimer, this.swingTimer + this.swingTime, -this.semiSweepAngle + this.pointingAngle, this.semiSweepAngle + this.pointingAngle);
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
    super(wielder, 5, 1.5, 700, Math.PI / 3, 200);
  }
}

class Hyperion extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 5, 150, Math.PI - 0.01, 100);
  }

  attack(enemies, direction, time) {
    this.wielder.health = max(this.wielder.health, 150);
    return super.attack(enemies, direction, time);
  }
}