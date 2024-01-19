class NPC extends Entity {
  constructor(_pos, _name, _interactDistance, _collisionMap, _textureSet, _animationSpeed, _scaleFactor) {
    super(_pos, 10, 0, 0, _collisionMap, _textureSet, _animationSpeed, _scaleFactor);
    this.name = _name;
    this.interactDistance = _interactDistance;
  }

  operate(player, time) {
    if(dist(this.pos[0], this.pos[1], player.pos[0], player.pos[1]) < this.interactDistance && keyIsDown(32)) {
      this.execute(player);
    }
  }

  execute(player) {}
}

class Blacksmith extends NPC {
  constructor(_pos, _collisionMap) {
    super(_pos, "Blacksmith", 2.2, _collisionMap, textures.blacksmithTileSet, 1, 1);
  }

  execute(player) {
    menuManager.menus.push(new UpgradeMenu());
  }
}