class player {
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
    if(this.collisionMap[Math.floor(this.pos[1] + j*distance)][Math.floor(this.pos[0] + i*distance)] !== 0){
      this.pos[0] += i*distance;
      this.pos[1] += j*distance;
    }
  }
}