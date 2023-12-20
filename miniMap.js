/* eslint-disable no-undef */
class MiniMap {
  constructor(_radius, _map){
    this.raster = generateCircle(_radius);
    this.map = structuredClone(_map);
    for(let i = 0; i < this.map.length; i++) {
      for(let j = 0; j < this.map[0].length; j++) {
        this.map[i][j] -= 100;
      }
    }
  }

  updateDiscovered(pos) {
    for(let i = 0; i < this.map.length; i++) {
      for(let j = 0; j < this.map[0].length; j++) {
        if(dist(j, i, pos[0], pos[1]) < 8 && this.map[i][j] < 0) {
          this.map[i][j] += 100;
        }
      }
    }
  }

  generateImage(pos){
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
            else if(this.map[v][u] === 0) {
              img.pixels[i] = 30;
              img.pixels[i+1] = 30;
              img.pixels[i+2] = 30;
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
    return img;
  }
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