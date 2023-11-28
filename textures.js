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
}

class Scene {
  constructor(_map, _scale, _tileSet){
    this.myMap = _map;
    this.scale = _scale;
    this.tileSet = _tileSet;
  }
  generateScene(center){
    let img = createImage(this.tileSet.size[0]*this.scale[0], this.tileSet.size[1]*this.scale[1]);
    const rangeX = Math.floor((this.scale[0]+1)*0.5);
    const rangeY = Math.floor((this.scale[1]+1)*0.5);
    const offsetX = -(center[0]-rangeX);
    const offsetY = -(center[1]-rangeY);
    for(let y=Math.floor(center[1])-rangeY; y<center[1]+rangeY; y++){
      for(let x=Math.floor(center[0])-rangeX; x<center[0]+rangeX; x++){
        if(y>-1 && y<this.myMap.length && x>-1 && x<this.myMap[0].length){
          img.copy(
            this.tileSet.assets[this.myMap[y][x]], 0, 0, this.tileSet.size[0], this.tileSet.size[1],
            (x+offsetX)*this.tileSet.size[0], (y+offsetY)*this.tileSet.size[1], this.tileSet.size[0], this.tileSet.size[1]
          );
        }
      }
    }
    return img;
  }
}