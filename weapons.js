/* eslint-disable no-undef */
class HeldItem {
  constructor(wielder) {
    this.wielder = wielder;
  }
}

class MeleeWeapon extends HeldItem {
  constructor(wielder, damage, range, delay) {
    super(wielder);
    this.damage = damage;
    this.range = range;
    this.delay = delay;
  }
}

class SweepWeapon extends MeleeWeapon {
  constructor(wielder, damage, range, delay, sweepRange) {
    super(wielder, damage, range, delay);
    this.sweepRange = sweepRange;
  }

  attack(enemies, direction, time) {
    for(let enemy of enemies) {
      let distance = dist(enemy.pos[0], enemy.pos[1], this.wielder.pos[0], this.wielder.pos[1]);
      let targetVector = [enemy.pos[0] - this.wielder.pos[0], enemy.pos[1] - this.wielder.pos[1]];
      if(distance <= this.range && dotProduct(scaleVector(direction), scaleVector(targetVector)) > this.sweepRange) {
        enemy.damage(this.damage, "Slashing");
      }
      // console.log(dotProduct(scaleVector(direction), scaleVector(targetVector)));
    }
    return this.delay + millis();
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