class Player {
  constructor(_pos, _health, _defence, _speed, _collisionMap){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
  }
  move(direction, time){
    let [i, j] = direction;
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0] + direction[0]*0.5 + i*distance)  ] !== 0){
      this.pos[0] += i*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1]+direction[1]*0.5 + j*distance)][Math.floor(this.pos[0])] !== 0){
      this.pos[1] += j*distance;
    }
  }
  display(screenCenter, screenSize, scale){
    let [x, y] = [screenCenter[0]-this.pos[0], screenCenter[1]-this.pos[1]];
    let xRatio = screenSize[0]/scale;
    let yRatio = screenSize[1]/scale;
    circle((xRatio*0.5+x)*scale, (yRatio*0.5+y)*scale, scale*0.9);
  }
}