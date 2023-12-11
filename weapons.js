class HeldItem {
  constructor(wielder) {
    this.wielder = wielder;
  }
}

class MeleeWeapon extends HeldItem {
  constructor(wielder, damage, range) {
    super(wielder);
    this.damage = damage;
    this.range = range;
  }
}

class Sword extends MeleeWeapon {
  constructor(wielder) {
    super(wielder, 5, 1);
    this.sweepRange = 0.8;
  }

  attack(enemies, direction, time) {
    for(let enemy of enemies) {
      let distance = dist(enemy.pos[0], enemy.pos[1], this.wielder.pos[0], this.wielder.pos[1]);
      let targetVector = [enemy.pos[0] - this.wielder.pos[0], enemy.pos[1] - this.wielder.pos[1]];
      if(dotProduct(scaleVector(direction), scaleVector(targetVector)) > this.sweepRange) {
        enemy.damage(this.damage, "Slashing");
      }
    }
  }
}