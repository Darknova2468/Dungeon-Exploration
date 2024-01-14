/* eslint-disable no-undef */

class Item {
  constructor(_wielder, _animationSet, _tileSet, _scaleFactor) {
    this.wielder = _wielder;
    this.held = true;
    this.animationSet = _animationSet;
    this.tileSet = _tileSet;
    this.scaleFactor = _scaleFactor ?? 1;
    this.tileScaleFactor = 1;
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
    this.direction = [random(-1,1), random(-1,1)];
    this.speed = random(7);
    this.locked = false;
  }

  // display(screenCenter, screenSize) {

  // }
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

class Coin extends DroppedItem {
  constructor(pos, value, collisionMap) {
    super(pos, {tileSet : "yellow"}, collisionMap);
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