/* eslint-disable no-undef */
let squareSize; // Side length of squares
const padding = 10; // Minimum padding between grid and edges of screen
let startX; // Top-right x-position of grid
let startY; // Top-right y-position of grid
const xSize = 150; // Number of squares across
const ySize = 75; // Number of squares down

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
    if(Math.ceil(this.health)%2 === 1){
      image(this.tileSet.assets[1], this.pos[0]+n*this.scale*this.tileSet.size[0], this.pos[1], this.tileSet.size[0]*this.scale, this.tileSet.size[1]*this.scale);
    }
  }
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
        if(dist(j, i, pos[0], pos[1]) < 6 && this.map[i][j] < 0) {
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
    let scaleY = this.map[0].length*scaleX/this.map.length;
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