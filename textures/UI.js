/* eslint-disable no-undef */
let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down

class Menu {
  constructor(_name, _text, _commands, _priority, _x = width * 2 / 7, _y = height * 3 / 7, _marginCol = color(100, 50, 50, 255), _fillCol = color(70, 70, 70, 255), _defaultTextCol = color("white"), _highlightedTextCol = color(255, 150, 150)) {
    this.graphics = createGraphics(550, 375);
    this.graphics.imageMode(CENTER);
    this.toDisplay = true;
    this.priority = _priority ?? -1;
    this.name = _name ?? "";
    this.text = _text ?? "";
    // this.text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis pharetra dolor. Morbi massa massa, gravida tristique interdum eu, egestas eget arcu. Fusce rhoncus mi sit amet justo hendrerit sollicitudin. In porttitor turpis in nunc rhoncus, eget maximus erat laoreet. Fusce porttitor, erat ac pulvinar elementum, erat felis finibus metus, et scelerisque nibh elit ac dui. Morbi id varius dui. Donec venenatis tempus nisi in efficitur. Morbi justo urna, convallis nec purus sit amet, commodo facilisis lectus. Fusce maximus bibendum risus, nec ultrices nisi. Fusce ac nibh quis orci vestibulum aliquam. Duis sit amet scelerisque erat. Ut at quam eget.";
    this.commands = _commands ?? [];
    this.chosenCommand = -1;
    this.padding = 10;
    this.x = _x;
    this.y = _y;
    this.marginCol = _marginCol;
    this.fillCol = _fillCol;
    this.defaultTextCol = _defaultTextCol;
    this.highlightedTextCol = _highlightedTextCol;
    this.commandFontSize = 15;
    this.commandStartHeight = 1/2;
    this.commandOffset = 1;
  }

  isHovering(i) {
    return this.padding * 2 < mouseX && mouseX < this.graphics.width - 2 * this.padding 
      && this.graphics.height * this.commandStartHeight + (2 * i + this.commandOffset) * this.padding * this.commandFontSize / 15 < mouseY 
      && mouseY < this.graphics.height * this.commandStartHeight + (2 * i + this.commandOffset + 2) * this.padding * this.commandFontSize / 15;
  }

  update() {
    for(let i = 0; i < this.commands.length; i++) {
      if(this.isHovering(i)) {
        this.chosenCommand = i;
      }
    }
    if(this.chosenCommand !== -1) {
      this.applyCommand(this.chosenCommand);
      // this.toDisplay = false;
    }
  }

  display() {
    if(!this.toDisplay) {
      return;
    }

    // Temporary positioning
    this.graphics.background(this.marginCol);
    this.graphics.fill(this.fillCol);
    this.graphics.rectMode(CORNER);
    this.graphics.rect(this.padding, this.padding,
      this.graphics.width - 2 * this.padding, this.graphics.height - 2 * this.padding);

    // Name
    this.graphics.fill(this.defaultTextCol);
    this.graphics.textSize(20);
    this.graphics.text(this.name, this.padding * 2, this.padding * 2, this.graphics.width - 4 * this.padding);

    // Text
    this.graphics.textSize(12);
    this.graphics.text(this.text, this.padding * 2, this.padding * 5, this.graphics.width - 4 * this.padding);
    
    // Commands
    this.graphics.textSize(this.commandFontSize);
    for(let i = 0; i < this.commands.length; i++) {
      if(this.isHovering(i)) {
        this.graphics.fill(this.highlightedTextCol);
      }
      else {
        this.graphics.fill(this.defaultTextCol);
      }
      this.graphics.text(this.commands[i], this.padding * 2, this.graphics.height * this.commandStartHeight + 2 * i * this.padding * this.commandFontSize / 15);
    }

    // Final display
    image(this.graphics, this.x, this.y);
  }

  applyCommand(cmd) {
    this.toDisplay = false;
  }
}

const PAUSEMENUTEXT = `The game is paused.

Controls:
Escape - Pause game / hide inventory / close menu
WASD - Move
Shift - Roll (move faster while moving with WASD)
1/2/3/4/5 - Switch to hotbar slot
E - Toggle inventory
M - Toggle map
Caps Lock - View map
Space - interact with NPCs / portals
Click/hold in direction with weapon to attack
`;

class PauseMenu extends Menu {
  constructor() {
    super("Pause Menu", PAUSEMENUTEXT, ["> Resume Game"], 255);
    this.commandStartHeight = 3/4;
    if(myDungeon.floorNumber > 0) {
      this.commands.push("> Return to Guild Hall");
    }
  }

  applyCommand(cmd) {
    if(cmd === 1) {
      myDungeon.cleanUp(player.activeZone);
      myDungeon = createDungeonMap(0);
      restorePlayer(player);
      enterDungeonMap(myDungeon);
    }
    super.applyCommand(cmd);
  }
}

class SpecificUpgradeMenu extends Menu {
  constructor(_index, _weapon) {
    super("Blacksmith > Buy / Upgrade ".concat(_weapon), "Querying ".concat(_weapon.concat("...")), ["> Back to Upgrade Menu"], 105);
    this.index = _index;
    this.weapon = _weapon;
    this.mode = 0;
    this.costs = 0;
    for(let cell of player.inventory.storage) {
      if(cell.holding !== null && cell.holding.name === this.weapon) {
        this.mode = cell.holding.tier;
      }
    }

    // See weapons.js for specific costs
    if(this.mode >= 5) {
      this.text = "You've already reached tier 5, I don't have the power to upgrade it any further!";
    }
    else {
      this.costs = WEAPONCOSTS[this.index][this.mode];
      if(this.mode === 0) {
        this.text = "Want a ".concat(_weapon.concat(" for ".concat(this.costs.toString().concat(" coins?"))));
        this.commands.push("> Buy weapon");
      }
      else {
        this.text = "Upgrade this ".concat(_weapon.concat(" to tier ".concat((this.mode + 1).toString().concat(" for ".concat(this.costs.toString().concat(" coins!"))))));
        this.commands.push("> Upgrade weapon");
      }
    }
  }

  applyCommand(cmd) {
    if(cmd === 0) {
      menuManager.menus.push(new UpgradeMenu());
    }
    else {
      if(player.money < this.costs) {
        this.text = "You don't have enough coins!";
        return;
      }
      else if(this.mode === 0) {
        if(player.inventory.attemptCollect(new WEAPONCLASSES[this.index](null))) {
          player.money -= this.costs;
        }
      }
      else {
        let found = false;
        for(let cell of player.inventory.storage) {
          if(cell.holding !== null && cell.holding.name === this.weapon) {
            cell.holding.tier += 1;
            found = true;
            break;
          }
        }
        if(found) {
          player.money -= this.costs;
        }
      }
      player.updateHolding();
      menuManager.menus.push(new SpecificUpgradeMenu(this.index, this.weapon));
    }
    
    super.applyCommand(cmd);
  }
}

class UpgradeMenu extends Menu {
  constructor() {
    super("Blacksmith", "Buy and upgrade weapons with me!", ["> Buy / Upgrade Dagger", 
      "> Buy / Upgrade Sword", "> Buy / Upgrade Axe", "> Buy / Upgrade Spear",
      "> Buy / Upgrade Shortbow", "> Buy / Upgrade Longbow"], 100);
  }

  applyCommand(cmd) {
    menuManager.menus.push(new SpecificUpgradeMenu(cmd, WEAPONS[cmd]));
    super.applyCommand(cmd);
  }
}

class PortalMenu extends Menu {
  constructor(_floorNum) {
    super("Portal", "Querying...", [], 50);
    this.floorNum = _floorNum;
    if(this.floorNum === 0) {
      this.commandFontSize = 10;
      this.commandStartHeight = 1/5;
      this.commandOffset = 2;
      this.openFloors = [];
      this.text = "Select floor below to conquer!";
      // this.openFloors.push(1);
      // allDungeons.forEach((value, key, map) => {
      //   if(value.floorNumber !== 0 && value.dungeon[value.dungeon.length - 1].healed) {
      //     this.openFloors.push(value.floorNumber + 1);
      //   }
      // });
      for(let i = 1; i <= 20; i++) {
        if((1 << (i-1)) & floorBitmask) {
          this.openFloors.push(i);
        }
      }
      // for(let d of allDungeons) {
      //   this.openFloors.push(d.floorNumber);
      // }
      this.commands = ["> Stay in guild hall"];
      for(let n of this.openFloors) {
        this.commands.push("> Go to floor ".concat(n));
      }
    }
    else {
      this.text = "Where do you wish to go?";
      this.commands = ["> Stay on floor ".concat(this.floorNum),
        "> Proceed to floor ".concat(this.floorNum + 1),
        "> Return to guild hall"];
    }
  }

  applyCommand(cmd) {
    super.applyCommand(cmd);
    if(this.floorNum === 0) {
      if(cmd === 0) {
        return;
      }
      myDungeon = createDungeonMap(this.openFloors[cmd - 1]);
      enterDungeonMap(myDungeon);
    }
    else {
      if(cmd === 0) {
        return;
      }
      else if(cmd === 1) {
        myDungeon = createDungeonMap(this.floorNum + 1);
        enterDungeonMap(myDungeon);
      }
      else {
        myDungeon = createDungeonMap(0);
        enterDungeonMap(myDungeon);
      }
    }
  }
}

class RespawnMenu extends PauseMenu {
  constructor() {
    super();
    this.name = "You died!";
    this.text = thisDeathMessage;
  }
}

class MenuManager {
  constructor() {
    this.menus = new Heap([new PauseMenu()], (a, b) => a.priority - b.priority > 0);
    this.pauseCountDown = 1; // Allow for sufficient frames before pause can work
    this.paused = false;
  }

  triggerUpdate() {
    this.menus.heap[1].update();
  }

  operate() {
    while(this.menus.heap.length > 1 && !this.menus.heap[1].toDisplay) {
      this.menus.pop();
    }
    if(this.menus.heap.length <= 1 || this.pauseCountDown > 0) {
      this.paused = false;
      if(this.pauseCountDown > 0) {
        this.pauseCountDown -= 1;
      }
      return;
    }
    this.paused = true;
    this.menus.heap[1].display();
  }
}

class InventoryCell {
  constructor(_graphics, _inventory, _pos, _size, _pointer, _accepts = "all") {
    this.graphics = _graphics;
    this.graphics.noSmooth();
    this.inventory = _inventory;
    this.pos = _pos;
    this.size = _size;
    this.pointer = _pointer;
    this.accepts = _accepts;
    this.holding = null;
  }

  display(x, y, toggled = false, held = false) {
    if(held && toggled) {
      this.graphics.fill(color(255, 200, 200));
    }
    else if(held) {
      this.graphics.fill(color(255, 100, 100));
    }
    else if(toggled) {
      this.graphics.fill(255);
    }
    else if(this.inventory.shown && this.checkPos(x, y)) {
      this.graphics.fill(200);
    }
    else {
      this.graphics.fill(150);
    }
    this.graphics.stroke(0);
    this.graphics.rect(this.pos[0], this.pos[1], this.size, this.size);
    if(this.pointer < 5) {
      this.graphics.fill(0);
      this.graphics.text(this.pointer + 1, this.pos[0] + 5, this.pos[1] + this.inventory.padding / 2);
    }
    if(this.holding === null) {
      return;
    }

    this.graphics.push();
    this.graphics.translate(this.pos[0] + this.size / 2, this.pos[1] + this.size / 2);
    this.graphics.rotate(this.holding.tileAngle);
    try {
      // rotate(0);
      this.holding.updateTileNumber();
      this.graphics.image(this.holding.tileSet.assets[this.holding.tileNumber], 0, 0, 
        this.holding.tileSet.size[0]*this.holding.tileScaleFactor, 
        this.holding.tileSet.size[1]*this.holding.tileScaleFactor);
      // this.graphics.image(this.holding.tileSet.assets[0], 0, 0);
    }
    catch {
      this.graphics.fill(this.holding.tileSet);
      this.graphics.noStroke();
      this.graphics.circle(0, 0, 20 * this.holding.tileScaleFactor);
    }
    this.graphics.pop();
  }

  checkPos(x, y) {
    return this.pos[0] < x && x < this.pos[0] + this.size
      && this.pos[1] < y && y < this.pos[1] + this.size;
  }
}

const ARMORTYPES = ["helmet", "chestplate", "leggings", "boots"];

class Inventory {
  constructor(_player) {
    this.player = _player;
    this.graphics = createGraphics(550, 375);
    this.graphics.imageMode(CENTER);
    this.squareSize = 75;
    this.padding = 25;
    this.shown = false;
    this.hotbarSize = 5;
    this.invHeight = 4;
    this.armorSize = 4;
    this.storage = [];
    this.hotbar = [];
    this.pointer = -1;
    for(let i = 0; i < this.invHeight; i++) {
      for(let j = 0; j < this.hotbarSize; j++) {
        if(i === 0) {
          this.storage.push(new InventoryCell(this.graphics, this, [this.squareSize * j + this.padding, this.padding], this.squareSize, this.hotbarSize * i + j));
          this.hotbar.push(this.storage[j]);
        }
        else {
          this.storage.push(new InventoryCell(this.graphics, this, [this.squareSize * j + this.padding, this.squareSize * i + 2 * this.padding], this.squareSize, this.hotbarSize * i + j));
        }
      }
    }
    for(let i = 0; i < this.armorSize; i++) {
      this.storage.push(new InventoryCell(this.graphics, this, [this.graphics.width - this.padding - this.squareSize, 3/2 * this.padding + i * this.squareSize], this.squareSize, this.hotbarSize * this.invHeight + i, ARMORTYPES[i]));
    }
  }

  update() {
    this.x = mouseX - width/2 + this.graphics.width/2;
    this.y = mouseY - height/2 + this.graphics.height/2;
    let pointer = -1;
    for(let cell of this.storage) {
      if(cell.checkPos(this.x, this.y)) {
        pointer = cell.pointer;
        break;
      }
    }
    if(pointer === -1) {
      this.pointer = -1;
    }
    else if(this.pointer === -1) {
      this.pointer = pointer;
    }
    else {
      this.swap(this.pointer, pointer);
      this.pointer = -1;
    }
  }

  swap(i, j) {
    let tmpSlot = this.storage[i].holding;
    this.storage[i].holding = this.storage[j].holding;
    this.storage[j].holding = tmpSlot;
    this.player.updateHolding();
  }

  display() {
    this.graphics.background("midnightblue");
    this.x = mouseX - width/2 + this.graphics.width/2;
    this.y = mouseY - height/2 + this.graphics.height/2;
    for(let cell of this.storage) {
      cell.display(this.x, this.y, this.pointer === cell.pointer, this.player.holdingIndex === cell.pointer);
    }
    if(this.shown) {
      image(this.graphics, width/2, height/2);
    }
    else {
      imageMode(CORNER);
      image(this.graphics, width - this.padding * 2 - this.squareSize * this.hotbarSize, height - this.padding * 2 - this.squareSize);
      imageMode(CENTER);
    }
  }

  attemptCollect(item) {
    for(let i = 0; i < this.hotbarSize * this.invHeight; i++) {
      if(this.storage[i].holding === null) {
        this.storage[i].holding = item;
        item.wielder = this.player;
        return true;
      }
    }
    console.log("! Inventory full !");
    return false;
  }
}

class HealthBar {
  constructor(_health, _tileSet, _pos, _scale){
    this.health = _health;
    this.tileSet = _tileSet;
    this.pos = _pos;
    this.scale = _scale;
  }
  display(health){
    this.health = health; 
    let n = Math.floor(this.health*0.5);
    for(let i=0; i<n; i++){
      image(this.tileSet.assets[0], this.pos[0]+i*this.scale*this.tileSet.size[0], this.pos[1], this.tileSet.size[0]*this.scale, this.tileSet.size[1]*this.scale);
    }
    if(Math.floor(this.health)%2 === 1){
      image(this.tileSet.assets[1], this.pos[0]+n*this.scale*this.tileSet.size[0], this.pos[1], this.tileSet.size[0]*this.scale, this.tileSet.size[1]*this.scale);
    }
  }
}

LIGHTINGDEBUG = false;

class Lighting {
  constructor() {
    this.updateMillis = 10;
    this.updateTimer = millis();
    this.light = 0;
    this.ambience = color(0,0,0,0);
    this.screenSize = [0, 0];
    this.playerPos = [0, 0];
    this.cachedImage = createImage(width, height);
  }
  update(light, ambience, screenCenter, screenSize, player) {
    if(millis() - this.updateTimer < this.updateMillis) {
      this.display();
      return;
    }
    this.updateTimer = millis();
    if(LIGHTINGDEBUG) {
      console.log("Updating lighting.");
    }
    let playerPos = dungeonToScreenPos(player.pos, screenCenter, screenSize);
    if(this.light === light && compareCols(ambience, this.ambience)
        && this.playerPos[0] === playerPos[0]
        && this.playerPos[1] === playerPos[1]
        && this.screenSize[0] === screenSize[0]
        && this.screenSize[1] === screenSize[1]) {
      this.display();
      return;
    }
    this.light = light;
    this.ambience = ambience;
    this.screenSize = structuredClone(screenSize);
    this.playerPos = structuredClone(playerPos);
    this.display(false);
  }
  display(drawCached = true) {
    if(!drawCached) {
      let img = createImage(width, height);
      img.loadPixels();
      let xScale = this.screenSize[0] / width;
      let yScale = this.screenSize[1] / height;
      let lightScale = 120 / Math.pow(this.light, 1.5);
      let i = 0;
      let rVal = red(this.ambience);
      let gVal = green(this.ambience);
      let bVal = blue(this.ambience);
      let aVal = alpha(this.ambience);
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          let d = (this.playerPos[0] - x)*xScale * ((this.playerPos[0] - x)*xScale) + (this.playerPos[1] - y)*yScale * ((this.playerPos[1] - y)*yScale);
          img.pixels[i] = rVal;
          img.pixels[i+1] = gVal;
          img.pixels[i+2] = bVal;
          img.pixels[i+3] = Math.min(lightScale * d, aVal);
          i += 4;
        }
      }
      img.updatePixels();
      this.cachedImage = img;
    }
    imageMode(CORNER);
    image(this.cachedImage, 0, 0, width, height);
    imageMode(CENTER);
  }
}

function compareCols(a, b) {
  return red(a) === red(b) && green(a) === green(b)
    && blue(a) === blue(b) && alpha(a) === alpha(b);
}

class Maps {
  constructor(_radius, _map, _pos, _scale){
    this.raster = generateCircle(_radius);
    this.map = structuredClone(_map);
    for(let i = 0; i < this.map.length; i++) {
      for(let j = 0; j < this.map[0].length; j++) {
        this.map[i][j] -= 100;
      }
    }
    this.pos = _pos;
    this.scale = _scale;
  }
  updateDiscovered(pos) {
    for(let i = 0; i < this.map.length; i++) {
      for(let j = 0; j < this.map[0].length; j++) {
        if(dist(j, i, pos[0], pos[1]) < player.vision && this.map[i][j] < 0) {
          this.map[i][j] += 100;
        }
      }
    }
  }
  displayMinimap(pos){
    this.updateDiscovered(pos);
    let posX = Math.floor(pos[0]);
    let posY = Math.floor(pos[1]);
    let img = createImage(this.raster.length, this.raster[0].length);
    img.loadPixels();
    let i=0;
    for(let y=0; y<this.raster.length; y++){
      for(let x=0; x<this.raster[y].length; x++){
        if(this.raster[y][x] !== undefined){
          let [u, v] = this.raster[y][x];
          u = u+posX;
          v = v+posY;
          img.pixels[i+3] = 127;
          if(u > -1 && u < this.map[0].length && v > -1 && v < this.map.length){
            if(this.map[v][u] >= 1){
              img.pixels[i] = 255;
              img.pixels[i+1] = 255;
              img.pixels[i+2] = 255;
              img.pixels[i+3] = 255;
            }
          }
        }
        i+=4;
      }
    }
    i = 0;
    i = Math.floor(0.5*this.raster.length*this.raster.length)*4;
    img.pixels[i+1] = 0;
    img.pixels[i+2] = 0;
    img.updatePixels();
    image(img, this.pos[0], this.pos[1], this.scale[0], this.scale[1]);
  }
  displayMap(pos){
    let img = createImage(this.map[0].length, this.map.length);
    img.loadPixels();
    let i=0;
    for(let u = 0; u < this.map.length; u++){
      for(let v = 0; v < this.map[0].length; v++) {
        if(this.map[u][v] > 0) {
          img.pixels[i] = 255;
          img.pixels[i+1] = 255;
          img.pixels[i+2] = 255;
          img.pixels[i+3] = 255;
        }
        else{
          img.pixels[i+3] = 127;
        }
        i+=4;
      }
    }
    i = (Math.floor(pos[1])*this.map[0].length+Math.floor(pos[0]))*4;
    img.pixels[i+1] = 0;
    img.pixels[i+2] = 0;
    img.updatePixels();
    let scaleX = this.map.length/(width-16*padding) > this.map[0].length/(height-4*padding) ? this.map.length*(height-4*padding)/this.map[0].length:width-16*padding;
    let scaleY = this.map.length*scaleX/this.map[0].length;
    image(img, width/2, height/2, scaleX, scaleY);
  }
}

class Damage{
  constructor(_pos, _num){
    this.pos = _pos;
    this.time = millis();
    this.timer = 500;
    this.textureSet = textures.numbers;
    this.isAlive = true;
    let num = round(_num).toString().split("");
    this.img = createImage(this.textureSet.size[0]*num.length, this.textureSet.size[1]);
    for(let i=0; i<num.length; i++){
      this.img.copy(
        this.textureSet.assets[parseInt(num[i])], 0, 0, this.textureSet.size[0], this.textureSet.size[1],
        i*this.textureSet.size[0], 0, this.textureSet.size[0], this.textureSet.size[1]
      );
    }
  }
  operate(){
    if(millis()-this.time > this.timer){
      this.isAlive = false;
    }
  }
  display(screenCenter, screenSize){
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    let posScaleX = width/screenSize[0];
    let posScaleY = height/screenSize[1];
    x += screenSize[0]*0.5;
    y += screenSize[1]*0.5;
    image(this.img, x*posScaleX, y*posScaleY, this.img.width*2, this.img.height*2);
    // circle(x*posScaleX, y*posScaleX, 10);
  }
}

class EnemyHealthBar{
  constructor(_pos, _health, _offset , _scale){
    this.pos = _pos;
    this.offset = _offset;
    this.maxHealth = _health;
    this.scale = _scale;
  }
  display(pos, health, screenCenter, screenSize){
    this.pos = pos;
    if(health < this.maxHealth){
      let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
      let posScaleX = width/screenSize[0];
      let posScaleY = height/screenSize[1];
      x += screenSize[0]*0.5;
      y += screenSize[1]*0.5;
      y -= this.offset;
      strokeWeight(5);
      stroke("red");
      line((x-this.scale*0.5)*posScaleX, y*posScaleY, (x+this.scale*0.5)*posScaleX, y*posScaleY);
      stroke("green");
      line((x-this.scale*0.5)*posScaleX, y*posScaleY, (x-this.scale*0.5+this.scale*(health/this.maxHealth))*posScaleX, y*posScaleY);
      noStroke();
    }
  }
}

class SlimeBossHealthBar{
  constructor(_maxHealth, _maxTentacles){
    this.maxHealth = _maxHealth;
    this.maxTentacles = _maxTentacles;
  }
  display(health, tentacleNum){
    textAlign(CENTER);
    textSize(height/12);
    stroke("white");
    strokeWeight(2);
    fill("black");
    text("Gargantuan Slime", width/2, height/20);
    stroke(20);
    strokeWeight(height/16);
    line(width/8, height/6, width*7/8, height/6);
    strokeWeight(height/24);
    stroke("red");
    if(tentacleNum === 0){
      line(width/8, height/6, width*7/8, height/6);
      stroke("green");
      line(width/8, height/6, width/8 + health/this.maxHealth*(width*3/4), height/6);
    }
    else{
      let x = width/8;
      const space = height/16;
      const offset = width*3/4/this.maxTentacles+space/this.maxTentacles;
      for(let i=0; i<this.maxTentacles; i++){
        line(x, height/6, x+offset-space, height/6);
        x += offset;
      }
      stroke("green");
      x = width/8;
      for(let i=0; i<tentacleNum-1; i++){
        line(x, height/6, x+offset-space, height/6);
        x += offset;
      }
      line(x, height/6, x+(offset-space)*(health/this.maxHealth), height/6);
    }
    noStroke();
  }
}

class WarlordHealthBar {
  constructor(_maxHealth){
    this.maxHealth = _maxHealth;
    this.stages = 4;
  }

  display(health) {
    let stagesRemaining = Math.floor(4 * health / this.maxHealth);
    let stagePortionRemaining = 4 * health / this.maxHealth - stagesRemaining;
    console.log(stagePortionRemaining);
    textAlign(CENTER);
    textSize(height/12);
    stroke("white");
    strokeWeight(2);
    fill("black");
    text("Hobgoblin Warlord", width/2, height/20);
    stroke(20);
    strokeWeight(height/16);
    line(width/8, height/6, width*7/8, height/6);
    strokeWeight(height/24);
    stroke("red");
    let x = width/8;
    const space = height/16;
    const offset = width*3/4/this.stages+space/this.stages;
    for(let i=0; i<this.stages; i++){
      line(x, height/6, x+offset-space, height/6);
      x += offset;
    }
    stroke("green");
    x = width/8;
    for(let i=0; i<stagesRemaining; i++){
      line(x, height/6, x+offset-space, height/6);
      x += offset;
    }
    line(x, height/6, x+(offset-space)*stagePortionRemaining, height/6);
    noStroke();
  }
}

function updateDimensions(y = ySize, x = xSize) {
  squareSize = min((height - 2*padding) / y, (width - 2*padding) / x);
  startX = max(padding, width/2 - squareSize * x / 2);
  startY = max(padding, height/2 - squareSize * y / 2);
}

function generateCircle(radius){
  let dist = 1-radius;
  let length = radius*2-1;
  let raster = new Array(length).fill(null);
  let x = 0;
  let y = radius-1;
  raster = fillLine(raster, -y, y+1, x, length);
  while(x <= y){
    if(dist < 0){
      dist += 2*x+3;
    }
    else {
      dist += 2*(x-y)+5;
      raster = fillLine(raster, -x, x+1, -y, length);
      raster = fillLine(raster, -x, x+1, y, length);
      y -= 1;
    }
    x += 1;
    raster = fillLine(raster, -y, y+1, -x, length);
    raster = fillLine(raster, -y, y+1, x, length);
  }
  return raster;
}

function fillLine(raster, x1, x2, y, length){
  let row = new Array(length).fill(undefined);
  let i = x1+0.5*(length-1);
  for(let x = x1; x < x2; x++){
    row[i] = [x, y];
    i+=1;
  }
  raster[y+0.5*(length-1)] = row;
  return raster;
}