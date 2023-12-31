/* eslint-disable no-undef */

function checkBounds(x, y, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  if (x1 * dx + y1 * dy < x * dx + y * dy && x * dx + y * dy < x2 * dx + y2 * dy) {
    let c = dx * y1 - dy * x1;
    return Math.abs((dy * x - dx * y + c) / dist(0, 0, dx, dy));
  }
  return -1;
}

// (i1 * di + j1 * dj < a * di + b * dj && a * di + b * dj < i2 * di + j2 * dj)

class Projectile extends Entity {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet) {
    super(structuredClone(_pos), 0, 0, 0, _collisionMap, _textureSet);
    this.initPos = structuredClone(this.pos);
    this.dir = _dir;
    this.hitDamage = _hitDmg;
    this.damageType = _dmgType;
    this.speed = Math.sqrt(_dir[0]*_dir[0] + _dir[1]*_dir[1]);
    this.maxDist = _maxDist;
    this.hitRange = _hitRange;
    this.draft = false;
    this.draftCol = "white";
    this.hitTimer = 0;
    this.hitCooldown = 50;
    this.canPierce = _canPierce;
    this.explosionRadius = _explosionRadius;
    this.explosionDamage = _explosionDamage;
    this.explosionDamageType = _explosionDamageType;
    this.invincible = true;
    this.radius = _hitRange;
    this.locked = true;
    this.lockedZone = _zone;
  }

  operate(targets, time) {
    if(!this.isAlive) {
      return;
    }
    this.prevPos = structuredClone(this.pos);
    this.move(this.dir, time);
    for(let target of targets) {
      let distance = checkBounds(target.pos[0], target.pos[1], this.prevPos[0], this.prevPos[1], this.pos[0], this.pos[1]);
      if(distance === -1) {
        continue;
      }
      if(distance < this.hitRange + target.radius && millis() - this.hitTimer > this.hitCooldown) {
        this.hit(target, time);
        this.hitTimer = millis();
      }
      // let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
      // if(distance < this.hitRange && millis() - this.hitTimer > this.hitCooldown) {
      //   this.hit(target, time);
      //   this.hitTimer = millis();
      // }
    }
    if(dist(this.pos[0], this.pos[1], this.initPos[0], this.initPos[1]) > this.maxDist) {
      this.isAlive = false;
    }
    if(!this.isAlive) {
      this.explode(targets, time);
    }
  }

  hit(target, time) {
    target.damage(this.hitDamage, this.damageType);
    if(!this.canPierce) {
      this.isAlive = false;
    }
  }

  explode(targets, time) {
    if(this.explosionRadius === 0) {
      return;
    }
    for(let target of targets) {
      let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
      if(distance < this.explosionRadius) {
        target.damage(this.explosionDamage, this.explosionDamageType);
      }
      else if(distance < this.explosionRadius + target.radius) {
        target.damage(this.explosionDamage / 2, this.explosionDamageType);
      }
    }
  }

  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)])
      && this.canMoveTo(this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])])){
      this.pos[0] += dx;
      this.pos[1] += dy;
    }
    else {
      this.isAlive = false;
    }
  }
}

/**
 * Enemy version of projectile, for only a single target
 * (the player)
 */
class EnemyProjectile extends Projectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet);
  }

  operate(target, enemies, time) {
    super.operate([target], time);
  }

  hit(target, time) {
    if(ENEMYDEBUG) {
      console.log("[Projectile] Hitting!");
    }
    super.hit(target, time);
  }
}