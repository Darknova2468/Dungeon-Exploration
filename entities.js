let entities = [];

class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _colour, _type, _radius){
    this.pos = _pos;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.colour = _colour;
    this.type = _type;
    this.radius = _radius;
  }
  move(direction, time){
    let [i, j] = direction;
    let distance = sqrt(i*i + j*j)!== 0 ? time*this.speed/sqrt(i*i + j*j) : 0;
    if(this.collisionMap[Math.floor(this.pos[1]+j*distance)][Math.floor(this.pos[0])] !== 0){
      this.pos[1] += j*distance;
    }
    if(this.collisionMap[Math.floor(this.pos[1])][Math.floor(this.pos[0]+i*distance)] !== 0){
      this.pos[0] += i*distance;
    }
  }
  display(screenCenter, screenSize, scale){
    scale *= this.radius;
    let [x, y] = [screenCenter[0]-this.pos[0], screenCenter[1]-this.pos[1]];
    let xRatio = screenSize[0]/scale;
    let yRatio = screenSize[1]/scale;
    fill(this.colour);
    circle((xRatio*0.5+x)*scale, (yRatio*0.5+y)*scale, scale*0.9);
  }
}

class Player extends Entity {
  constructor(_pos, _collisionMap){
    super(_pos, 10, 0, 5, _collisionMap, "white", "player", 1);
  }
}

class Enemy extends Entity {
  constructor(_pos, _level, _health, _defence, _speed, _collisionMap, _colour, _species, _radius){
    super(_pos, _health, _defence, _speed, _collisionMap, _colour, "enemy", _radius);
    this.level = _level;
    this.species = _species;
  }
}

class Slime extends Enemy {
  constructor(_pos, _level, _collisionMap) {
    let _radius = 1;
    if(_level >= 20) {
      _radius = 3;
    }
    else if(_level >= 10) {
      _radius = 2;
    }
    super(_pos, _level, _level * 2, 0, 4, _collisionMap, "green", "slime", _radius);
  }
}

function renderEntities(screenSize, scale) {
  for(let entity of entities) {
    if(entity.type === "player") {
      entity.display(entity.pos, screenSize, scale);
    }
  }
}