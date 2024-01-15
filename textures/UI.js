/* eslint-disable no-undef */
let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down

class Dialogue {
  constructor() {
    this.graphics = createGraphics(550, 375);
    this.graphics.imageMode(CENTER);
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
    this.graphics.stroke(0)
    this.graphics.rect(this.pos[0], this.pos[1], this.size, this.size);
    if(this.holding === null) {
      return;
    }

    this.graphics.push();
    this.graphics.translate(this.pos[0] + this.size / 2, this.pos[1] + this.size / 2);
    this.graphics.rotate(Math.PI / 4);
    try {
      // rotate(0);
      this.graphics.image(this.holding.tileSet.assets[0], 0, 0, 
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
      console.log("Updating lighting.")
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
      // for(let i = 0; i < width * height; i++) {
      //   let x = i % width;
      //   let y = Math.floor(i / width);
      //   let d = dist(0, 0, (this.playerPos[0] - x)*xScale, (this.playerPos[1] - y)*yScale);
      //   img.pixels[4*i] = 0;
      //   img.pixels[4*i+1] = 0;
      //   img.pixels[4*i+2] = 0;
      //   img.pixels[4*i+3] = Math.min(40*d, 255);
      //   // if(i === 0) {
      //   //   console.log(pixels[3]);
      //   // }
      // }
      let lightScale = 120 / Math.pow(this.light, 1.5);
      let i = 0;
      let rVal = red(this.ambience);
      let gVal = green(this.ambience);
      let bVal = blue(this.ambience);
      let aVal = alpha(this.ambience);
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          let d = ((this.playerPos[0] - x)*xScale) * ((this.playerPos[0] - x)*xScale) +  ((this.playerPos[1] - y)*yScale) * ((this.playerPos[1] - y)*yScale);
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
    let scaleX = width/this.map.length > height/this.map[0].length ? this.map.length*(height-2*padding)/this.map[0].length:width-2*padding;
    let scaleY = this.map.length*scaleX/this.map[0].length;
    image(img, width/2, height/2, scaleX, scaleY);
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