/**
 * Introducing spells and foci!
 * 
 * List of foci:
 * - Wand (silver): utility
 * - Rod (cyan): defence
 * - Amulet (green): healing
 * - Staff (red): offence
 * 
 * Controls (WIP):
 * - Cast/charge spells: left click, hold for more power
 * - Switch spells: x
 */

class Focus extends Item {
  constructor(name, id, wielder, animationSet, tileSet, scaleFactor) {
    super(name, wielder, animationSet, tileSet, scaleFactor);
    this.tier = 1;
    this.stackable = false;
    this.focusId = id;
  }

  attack(enemies, direction, time, isRolling) {
    // this.damage = WEAPONDAMAGE[this.weaponId][this.tier - 1];
  }

  updateTileNumber() {
    this.tileNumber = this.tier - 1;
  }
}

class Wand extends Focus {
  constructor(wielder) {
    super("Wand", 0, wielder, "", "silver");
  }
}