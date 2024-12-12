/**
 * Introducing spells and foci!
 * 
 * List of foci:
 * - Wand (silver): general use
 * - Orb (indigo): utility and manipulation
 * - Rod (cyan): defence
 * - Amulet (green): healing and support
 * - Staff (red): offence
 * 
 * Controls (WIP):
 * - Select spells: comma, period (27F2, 27F3)
 * - Cast/upcast spells: slash (26A1)
 * - Release spell: left click
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