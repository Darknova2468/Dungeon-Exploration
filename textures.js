/* eslint-disable no-undef */

let textures;

class TileSet{
  constructor(_path, _size){
    this.size = _size;
    this.assets = [];
    loadImage(_path, (tileSet) => {
      for (let j = 0; j < tileSet.height; j += _size[1]) {
        for (let i = 0; i < tileSet.width; i += _size[0]) {
          let newAsset = tileSet.get(i, j, _size[0], _size[1]);
          this.assets.push(newAsset);
        }
      }
    });
  }
}

class AnimateSet{
  constructor(_path, _size){
    this.size = _size;
    this.animations = [];
    loadImage(_path, (tileSet) => {
      for (let j = 0; j < tileSet.height; j += _size[1]) {
        let assets = [];
        for (let i = 0; i < tileSet.width; i += _size[0]) {
          let newAsset = tileSet.get(i, j, _size[0], _size[1]);
          if(!this.isEmpty(newAsset)){
            assets.push(newAsset);
          }
        }
        this.animations.push(assets);
      }
    });
  }
  isEmpty(img){
    img.loadPixels();
    for(let i=0; i<img.pixels.length; i++){
      if(img.pixels[i] !== 0){
        return false;
      }
    }
    return true;
  }
}

class Scene {
  constructor(_map, _scale, _tileSet){
    this.myMap = this.textureMap(_map);
    this.idMap = _map;
    this.scale = _scale;
    this.tileSet = _tileSet;
    this.displayOnly = null;
    this.fall = 0;

    // Transitioning variables
    this.transitioning = false;
    this.transitionTimer = 0;
    this.transitionTime = 0;
    this.initialScale = _scale;
    this.objectiveScale = _scale;
  }
  changeDimensions(objectiveScale, duration) {
    this.initialScale = structuredClone(this.scale);
    this.objectiveScale = objectiveScale;
    this.transitionTime = duration;
    this.transitionTimer = millis();
    this.transitioning = true;
  }
  updateDimensions() {
    if(!this.transitioning) {
      return;
    }
    if(millis() - this.transitionTimer >= this.transitionTime) {
      this.transitioning = false;
      this.scale = this.objectiveScale;
      return;
    }
    let sigmoid = 1 / (1 + Math.exp(-8*(millis() - (this.transitionTimer + this.transitionTime / 2))/this.transitionTime));
    // console.log(millis() - (this.transitionTimer + this.transitionTime / 2));
    this.scale[0] = this.objectiveScale[0] * sigmoid + this.initialScale[0] * (1 - sigmoid);
    this.scale[1] = this.objectiveScale[1] * sigmoid + this.initialScale[1] * (1 - sigmoid);
  }
  generateScene(center){
    this.updateDimensions();
    let img = createImage(this.tileSet.size[0]*this.scale[0], this.tileSet.size[1]*this.scale[1]);
    const rangeX = Math.ceil((this.scale[0]+2)*0.5);
    const rangeY = Math.ceil((this.scale[1]+2)*0.5);
    const offsetX = -(center[0]-this.scale[0]*0.5);
    const offsetY = -(center[1]-this.scale[1]*0.5);
    for(let y=Math.floor(center[1])-rangeY; y<center[1]+rangeY; y++){
      for(let x=Math.floor(center[0])-rangeX; x<center[0]+rangeX; x++){
        if(y>-1 && y<this.myMap.length && x>-1 && x<this.myMap[0].length){
          if(this.myMap[y][x]){
            this.myMap[y][x].forEach(id => {
              if(this.displayOnly === null || this.idMap[y][x] === this.displayOnly){
                img.copy(
                  this.tileSet.assets[id], 0, 0, this.tileSet.size[0], this.tileSet.size[1],
                  (x+offsetX)*this.tileSet.size[0], (y+offsetY)*this.tileSet.size[1], this.tileSet.size[0], this.tileSet.size[1]
                );
              }
              else if (this.fall < 10){
                img.copy(
                  this.tileSet.assets[id], 0, 0, this.tileSet.size[0], this.tileSet.size[1],
                  (x+offsetX)*this.tileSet.size[0], (y+offsetY+this.fall)*this.tileSet.size[1], this.tileSet.size[0], this.tileSet.size[1]
                );
              }
            });
          }
        }
      }
    }
    if(this.displayOnly === null){
      this.fall = 0;
    }
    else if(this.fall < 10){
      this.fall += 0.07;
    }
    return img;
  }
  textureMap(map){
    let textureMap = generateEmptyGrid(map[0].length, map.length, 0);
    for(let y = 1; y<map.length-1; y++){
      for(let x = 1; x<map[y].length-1; x++){
        let textureStack = textureMap[y][x] === 0 ? []:textureMap[y][x];
        if(map[y][x] !== 0){
          textureStack.push(0);
          if(map[y][x+1] === 0){
            textureStack.push(1);
          }
          if(map[y-1][x] === 0){
            textureStack.push(2);
          }
          if(map[y][x-1] === 0){
            textureStack.push(3);
          }
          if(map[y+1][x] === 0){
            textureStack.push(4);
            textureMap[y+1][x] = [5];
          }
          textureMap[y][x] = textureStack;
        }
      }
    }
    return textureMap;
  }
}