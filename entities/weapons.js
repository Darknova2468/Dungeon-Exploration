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
  constructor(wielder, damage, range, delay, sweepRange) {
    super(wielder, damage, range, delay);
    this.sweepRange = sweepRange;
    this.holdRange = 0.3;
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
    return this.delay + millis();
  }

  display(screenCenter, screenSize) {
    // let basePos = dungeonToScreenPos(this.wielder.pos, screenCenter, screenSize);
    let heldDisplacement = scaleVector([mouseX - width/2, mouseY - height/2], this.holdRange);
    let tipDisplacement = scaleVector([mouseX - width/2, mouseY - height/2], this.range);
    let heldPos = dungeonToScreenPos([this.wielder.pos[0] + heldDisplacement[0], this.wielder.pos[1] + heldDisplacement[1]], screenCenter, screenSize);
    let tipPos = dungeonToScreenPos([this.wielder.pos[0] + tipDisplacement[0], this.wielder.pos[1] + tipDisplacement[1]], screenCenter, screenSize);
    stroke(10);
    line(heldPos[0], heldPos[1], tipPos[0], tipPos[1]);
    // console.log(heldPos, tipPos, dungeonWeaponDisplacement);
  }
}

class Sword extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 1.5, 700, 0.5);
  }
}

class Hyperion extends SweepWeapon {
  constructor(wielder) {
    super(wielder, 5, 5, 100, -1);
  }

  attack(enemies, direction, time) {
    this.wielder.health = max(this.wielder.health, 150);
    return super.attack(enemies, direction, time);
  }
}