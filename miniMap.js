/* eslint-disable no-undef */
class MiniMap {
  constructor(_radius, _map){
    this.raster = this.generateCircleEgdes(_radius);
  }
  generateCircleEgdes(radius){
    let dist = 1-radius;
    let raster = generateEmptyGrid(2*radius - 1, 2*radius - 1);
    let x = 0;
    let y = radius-1;
    raster[y+radius-1][x+radius-1] = 1;
    raster[x+radius-1][y+radius-1] = 1;
    raster[radius-1-x][radius-1-y] = 1;
    raster[radius-1-y][radius-1-x] = 1;
    while(x <= y){
      if(dist < 0){
        dist += 2*x+3;
      }
      else {
        dist += 2*(x-y)+5;
        y -= 1;
      }
      x += 1;
      raster[y+radius-1][x+radius-1] = 1;
      raster[x+radius-1][y+radius-1] = 1;
      raster[radius-1-x][radius-1-y] = 1;
      raster[radius-1-y][radius-1-x] = 1;
      raster[x+radius-1][radius-1-y] = 1;
      raster[radius-1-y][x+radius-1] = 1;
      raster[radius-1-x][y+radius-1] = 1;
      raster[y+radius-1][radius-1-x] = 1;
    }
    return raster;
  }
}