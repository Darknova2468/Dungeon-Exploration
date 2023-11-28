/* eslint-disable no-undef */
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
  generateImage(map){
    let img = createImage(map.length*this.size[0], map[0].length*this.size[0]);
    for(let y=0; y<map.length; y++){
      for(let x=0; x<map[y].length; x++){
        img.copy(
          this.assets[map[y][x]], 0, 0, this.size[0], this.size[1],
          x*this.size[0], y*this.size[1], this.size[0], this.size[1]
        );
      }
    }
    return img;
  }
}

class Scene {
  constructor(_map, _scale, _scaleSpeed, _textureSize, _tileSet){
    this.myMap = _map;
    this.nextScale = _scale;
    this.scale = _scale;
    this.scaleSpeed = _scaleSpeed;
    this.textureSize = _textureSize;
    this.tileSet = _tileSet;
  }
  generateScene(center, newScale){
    this.nextScale = newScale;
    this.scale[0] += abs(this.scale[0]-this.nextScale[0])>this.scaleSpeed ? (this.nextScale[0]-this.scale[0]>0*-1)*this.scaleSpeed: this.nextScale[0];
    this.scale[1] += abs(this.scale[1]-this.nextScale[1])>this.scaleSpeed ? (this.nextScale[1]-this.scale[1]>0*-1)*this.scaleSpeed: this.nextScale[1];
    let img = createImage(this.textureSize[0]*this.scale[0], this.textureSize[1]*this.scale[1]);
    let rangeX = Math.floor((this.scale[0]+2)*0.5);
    let rangeY = Math.floor((this.scale[1]+2)*0.5);
    let offsetX = center[0]-center[0];
    let offsetY = center[1]-center[1];
    for(let y=Math.floor(center[1])-rangeY; y<center[1]+rangeY; y++){
      for(let x=Math.floor(center[0])-rangeX; x<center[0]+rangeX; x++){
        if(y>1 && y<this.myMap[0].length && x>-1 && x<this.myMap.length){
          img.copy(
            this.tileSet.assets[this.myMap[y][x]], 0, 0, this.textureSize[0], this.textureSize[1],
            (x-offsetX)*this.textureSize[0], (y-offsetY)*this.textureSize[1], this.textureSize[0], this.textureSize[1]
          );
        }
      }
    }
    return img;
  }
}