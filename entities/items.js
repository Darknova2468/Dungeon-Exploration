/* eslint-disable no-undef */

class Item {
  constructor(_wielder, _textureSet) {
    this.wielder = _wielder;
    this.held = true;
    this.textureSet = _textureSet;
  }

  displayHeld(screenCenter, screenSize) {}

  display(screenCenter, screenSize) {
    if(this.held) {
      this.displayHeld(screenCenter, screenSize);
    }
  }
}

class DroppedItem extends Entity {
  constructor(pos, item, collisionMap, animationSet, animationSpeed, scaleFactor) {
    super(pos, 1, 0, 0, collisionMap, animationSet, animationSpeed, scaleFactor);
    this.item = item;
    this.textureSet = item.textureSet;
    this.invincible = true;
    this.radius = 0.1;
  }

  display(screenCenter, screenSize) {

  }
}