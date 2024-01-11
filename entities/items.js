/* eslint-disable no-undef */

class Item {
  constructor(_wielder, _animationSet, _tileSet, _scaleFactor) {
    this.wielder = _wielder;
    this.held = true;
    this.animationSet = _animationSet;
    this.tileSet = _tileSet;
    this.scaleFactor = _scaleFactor ?? 1;
  }

  displayHeld(screenCenter, screenSize) {}

  display(screenCenter, screenSize) {
    if(this.held) {
      this.displayHeld(screenCenter, screenSize);
    }
  }
}

class DroppedItem extends Entity {
  constructor(pos, item, collisionMap) {
    super(pos, 1, 0, 0, collisionMap, item.tileSet);
    this.item = item;
    this.invincible = true;
    this.radius = 0.1;
  }

  display(screenCenter, screenSize) {

  }
}