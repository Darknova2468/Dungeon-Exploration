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