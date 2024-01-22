/* eslint-disable no-undef */

/**
 * File for armor types: helmet, chestplate, pants, and boots.
 * Not much else to say here.
 */

const ARMORTYPES = ["Helmet", "Chestplate", "Pants", "Boots"];

const ARMORHEALTHBONUS = [
  [1, 2, 4, 8, 16],
  [1, 2, 3, 4, 5],
  [1, 2, 3, 6, 10],
  [0, 0, 0, 0, 0]
];

const ARMORDEFENCEBONUS = [
  [1, 2, 3, 4, 5],
  [1, 2, 4, 8, 16],
  [1, 2, 3, 6, 10],
  [1, 2, 2, 2, 2]
];

const ARMORSPEEDBONUS = [
  [-0.1, -0.2, 0, 0, 0],
  [-0.1, -0.2, 0, 0, 0],
  [-0.1, -0.2, -0.1, -0.1, -0.1],
  [-0.1, -0.1, 0.5, 1, 1.5]
];

const ARMORCOSTS = [
  [80, 100, 300, 700, 1500],
  [80, 150, 400, 800, 1600],
  [80, 150, 400, 800, 1600],
  [80, 100, 300, 700, 1500]
];

class ArmorPiece extends Item {
  constructor(name, id, wielder, tileSet, scaleFactor) {
    super(name, wielder, "white", tileSet, scaleFactor);
    this.tileScaleFactor = 3;
    this.armorId = id;
    this.health = 0;
    this.defence = 0;
    this.speed = 0;
    this.stackable = false;
    this.tier = 1;
    this.tileAngle = 0;
  }

  updateStats() {
    this.health = ARMORHEALTHBONUS[this.armorId][this.tier - 1];
    this.defence = ARMORDEFENCEBONUS[this.armorId][this.tier - 1];
    this.speed = ARMORSPEEDBONUS[this.armorId][this.tier - 1];
    super.updateStats();
  }

  updateTileNumber() {
    this.tileNumber = this.tier - 1;
  }
}

class Helmet extends ArmorPiece {
  constructor(wielder) {
    super("Helmet", 0, wielder, textures.helmetTileSet, 1);
  }
}

class Chestplate extends ArmorPiece {
  constructor(wielder) {
    super("Chestplate", 1, wielder, textures.chestPlateTileSet, 1);
  }
}

class Pants extends ArmorPiece {
  constructor(wielder) {
    super("Pants", 2, wielder, textures.pantsTileSet, 1);
  }
}

class Boots extends ArmorPiece {
  constructor(wielder) {
    super("Boots", 3, wielder, textures.bootiesTileSet, 1);
  }
}

const ARMORCLASSES = [Helmet, Chestplate, Pants, Boots];