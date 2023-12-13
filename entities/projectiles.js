/* eslint-disable no-undef */
class Projectile extends Entity {
  constructor(_pos, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet) {
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
    this.hitTimer = millis();
    this.hitCooldown = 50;
    this.canPierce = _canPierce;
    this.explosionRadius = _explosionRadius;
    this.explosionDamage = _explosionDamage;
    this.explosionDamageType = _explosionDamageType;
    this.invincible = true;
  }

  operate(targets, time) {
    if(!this.isAlive) {
      return;
    }
    this.move(this.dir, time);
    for(let target of targets) {
      let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
      if(distance < this.hitRange && millis() - this.hitTimer > this.hitCooldown) {
        this.hit(target, time);
        this.hitTimer = millis();
      }
      if(dist(this.pos[0], this.pos[1], this.initPos[0], this.initPos[1]) > this.maxDist) {
        this.isAlive = false;
      }
    }
    if(!this.isAlive) {
      this.explode(targets, time);
    }
  }

  hit(target, time) {
    console.log("[Projectile] Hitting!");
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
    }
  }

  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.collisionMap[floor(this.pos[1])][floor(this.pos[0]+dx)] !== 0
      && this.collisionMap[floor(this.pos[1]+dy)][floor(this.pos[0])] !== 0){
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
  constructor(_pos, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, _dmgType, _hitRange, _canPierce, _explosionRadius, _explosionDamage, _explosionDamageType, _collisionMap, _textureSet)
  }

  operate(target, enemies, time) {
    super.operate([target], time);
  }
}