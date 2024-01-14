/* eslint-disable no-undef */

class Item {
  constructor(_wielder, _animationSet, _tileSet, _scaleFactor) {
    this.wielder = _wielder;
    this.held = true;
    this.animationSet = _animationSet;
    this.tileSet = _tileSet;
    this.scaleFactor = _scaleFactor ?? 1;
  }

  displayHeld(screenCenter, screenSize, pos) {}

  display(screenCenter, screenSize) {
    if(this.held) {
      this.displayHeld(screenCenter, screenSize);
    }
  }

  attack() {}
}

class DroppedItem extends Entity {
  constructor(pos, item, collisionMap) {
    super(pos, 1, 0, 0, collisionMap, item.tileSet);
    this.item = item;
    this.invincible = true;
    this.radius = 0.2;
  }

  // display(screenCenter, screenSize) {

  // }
  operate(player, time) {
    if(dist(this.pos[0], this.pos[1], player.pos[0], player.pos[1]) < 1) {
      player.inventory.attemptCollect(this.item);
    }
    if(this.item.wielder !== null) {
      this.isAlive = false;
    }
  }
}

class TestItem extends Item {
  constructor() {
    super(null, "white", "black");
  }
}

class TestDroppedItem extends DroppedItem {
  constructor(pos, collisionMap) {
    let item = new TestItem();
    super(pos, item, collisionMap);
  }
}