/* eslint-disable no-undef */

/**
 * Item classes, including the item itself, dropped item entities such as coins,
 * and lighting objects.
 */

class Item {
  constructor(_name, _wielder, _animationSet, _tileSet, _scaleFactor) {
    this.name = _name;
    this.wielder = _wielder;
    this.held = true;
    this.animationSet = _animationSet;
    this.tileSet = _tileSet ?? "magenta";
    this.scaleFactor = _scaleFactor ?? 1;
    this.tileScaleFactor = 1;
    this.stackable = true;
    this.tileNumber = 0;
    this.armorId = -1; // Necessary for denying armor slot access to most items
    this.tileAngle = Math.PI / 4;
    this.lightValue = 0;
  }

  displayHeld(screenCenter, screenSize, pos) {}

  display(screenCenter, screenSize) {
    if(this.held) {
      this.displayHeld(screenCenter, screenSize);
    }
  }

  attack() {}

  accepts() {}

  updateTileNumber() {}

  updateStats() {}
}

class DroppedItem extends Entity {
  constructor(_pos, _tileSet, _collisionMap) {
    super(_pos, 1, 0, 0, _collisionMap);
    this.tileSet = _tileSet;
    this.invincible = true;
    this.radius = 0.2;

    // Start moving in a random direction
    this.direction = [random(-1,1), random(-1,1)];
    this.speed = random(7);
    this.locked = false;
  }

  operate(player, time) {
    this.move(this.direction, time);
    this.speed *= 0.9;
    if(dist(this.pos[0], this.pos[1], player.pos[0], player.pos[1]) < 1) {
      player.inventory.attemptCollect(this.item);
    }
    if(this.item.wielder !== null) {
      this.isAlive = false;
    }
  }

  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)])){
      this.pos[0] += dx;
    }
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])])){
      this.pos[1] += dy;
    }
  }

  display(screenCenter, screenSize){
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    let posScaleX = width/screenSize[0];
    let posScaleY = height/screenSize[1];
    x += screenSize[0]*0.5;
    y += screenSize[1]*0.5;
    image(this.tileSet.assets[0], x*posScaleX, y*posScaleY, this.tileSet.size[0]*2, this.tileSet.size[1]*2);
  }
}

class TestItem extends Item {
  constructor() {
    super("test", null, "white", "black");
  }
}

/**
 * Generic lighting object.
 */
class LightingObject extends Item {
  constructor(_name, _wielder, _lightValue, _animationSet, _tileSet, _scaleFactor) {
    super(_name, _wielder, _animationSet, _tileSet, _scaleFactor);
    this.lightValue = _lightValue; // Glows
    this.stackable = false;
    this.tileScaleFactor = 2.5;
    this.tileAngle = 0;
  }
}

class Candle extends LightingObject {
  constructor(_wielder) {
    super("Candle", _wielder, 1, textures.candleAnimationSet, textures.candleTileSet);
  }
}

class Torch extends LightingObject {
  constructor(_wielder) {
    super("Torch", _wielder, 3, textures.torchAnimationSet, textures.torchTileSet);
  }
}

class TestDroppedItem extends DroppedItem {
  constructor(pos, collisionMap) {
    let item = new TestItem();
    super(pos, item, collisionMap);
  }
}

/**
 * Coin object which can be picked up and added to the player's wallet.
 */
class Coin extends DroppedItem {
  constructor(pos, value, collisionMap) {
    super(pos, textures.coinTileSet, collisionMap);
    this.value = value;
  }

  operate(player, time) {
    this.move(this.direction, time);
    this.speed *= 0.9;
    if(this.isAlive && dist(this.pos[0], this.pos[1], player.pos[0], player.pos[1]) < 1) {
      player.money += this.value;
      this.isAlive = false;
    }
  }
}

const LIGHTINGTYPES = ["Candle", "Torch"];
const LIGHTINGCLASSES = [Candle, Torch];
const LIGHTINGCOSTS = [100, 1000];