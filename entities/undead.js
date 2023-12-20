/* eslint-disable no-undef */
class Zombie extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap) {
    // super(_pos, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, _collisionMap, _textureSet);
    super(_pos, "Zombie", _roomId, _level, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, 10, 1, 2, "Bludgeoning", 1.5, 700, _collisionMap, textures.zombieTileSet);
    this.radius = 0.4;

    // Zombies stop when attacking and bite if close
    this.isMoving = 0;
    this.strafeMultiplier = -1;
    this.biteRadius = 0.7;
    this.biteDamage = 2;
    this.biteDamageType = "Piercing";
  }
  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time, distance);
      this.attackTimer = millis();
    }
    else if(distance > this.biteRadius) {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
      weights.weighMomentum(this.prevDirection);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, 0, this.strafeMultiplier, 20);
      weights.weighSocialDistancing(this.pos, enemies);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time, distance) {
    super.attack(player, time);
    if(distance <= this.biteRadius) {
      player.damage(this.biteDamage, this.biteDamageType);
      if(ENEMYDEBUG) {
        console.log("[Zombie] Bites.");
      }
    }
  }
}

class Skeleton extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap) {
    // super(_pos, Math.floor(_level + 4), 2, 2.5, _collisionMap, _textureSet);
    super(_pos, "Skeleton", _roomId, _level, Math.floor(_level + 4), 2, 2.5, 10, 6, 1, "Slashing", 1.5, 1000, _collisionMap, textures.skeletonTileSet);

    // I am Skeletor.
    this.retreatMidpoint = 4;
    this.throwRange = 8;
    this.throwTimer = millis();
    this.throwCooldown = 5000;
    this.throwStunTime = 1000;
    this.throwSpeed = 10;
    this.throwDamage = 10;
  }
  operate(player, enemies, time) {
    if(millis() - this.throwTimer < this.throwStunTime) {
      this.isMoving = 0;
    }
    else {
      super.operate(player, enemies, time);
    }
  }
  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.throwRange && millis() - this.throwTimer > this.throwCooldown) {
      // Throw
      let [x, y] = [player.pos[0]-this.pos[0],this.pos[1]-player.pos[1]];
      let angle = atan(Math.abs(y/x));
      if(angle < PI/6){
        this.animationNum[0] = 0;
      }
      else {
        this.animationNum[0] = y < 0 ? 2:1;
      }
      this.animationNum[1] = x > 0 && this.animationNum[0] !== 1 ? 0:1;
      this.throw(player, enemies, time, pursuitVector);
      this.throwTimer = millis();
    }
    else if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      let [x, y] = [player.pos[0]-this.pos[0],this.pos[1]-player.pos[1]];
      let angle = atan(Math.abs(y/x));
      if(angle < PI/6){
        this.animationNum[0] = 0;
      }
      else {
        this.animationNum[0] = y < 0 ? 2:1;
      }
      this.animationNum[1] = x > 0 && this.animationNum[0] !== 1 ? 0:1;
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
      weights.weighMomentum(this.prevDirection);
      // Skeletons keep their distance
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, this.retreatMidpoint);
      weights.weighSocialDistancing(this.pos, enemies);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
      let angle = atan(Math.abs(maxDir[1]/maxDir[0]));
      if(angle < PI/3){
        this.animationNum[0] = 0;
      }
      else {
        this.animationNum[0] = maxDir[1] > 0 ? 2:1;
      }
      this.animationNum[1] = maxDir[0] > 0 && this.animationNum[0] !== 1 ? 0:1;
    }
  }
  throw(player, enemies, time, pursuitVector) {
    if(ENEMYDEBUG) {
      console.log("[Skeleton] Throws a bone.");
    }
    enemies.push(new Bone(this.pos, this.lockedZone, scaleVector(pursuitVector, this.throwSpeed), this.throwRange, this.throwDamage, this.collisionMap));
  }
}

class Phantom extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, "Phantom", _roomId, _level, Math.floor(_level + 4), 0, 2, 15, 8, 3, "Necrotic", 1.5, 1000, _collisionMap, textures.phantomTileSet);

    // Necrotic spellcaster
    this.retreatMidpoint = 6;
    this.spellRange = 8;
    this.spellTimer = millis();
    this.spellCooldown = 7000;
    this.spellSpeed = 5;
    this.spellDamage = 7;
  }

  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.spellRange && millis() - this.spellTimer > this.spellCooldown) {
      // Casts a spell
      this.cast(player, enemies, time, pursuitVector);
      this.spellTimer = millis();
    }
    else if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.pos, 2, 3); // Tweak for different AI
      weights.weighMomentum(this.prevDirection);
      // Phantoms also keep their distance
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, this.retreatMidpoint);
      weights.weighSocialDistancing(this.pos, enemies);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
    this.animationNum[1] = (this.pos[0] > player.pos[0])*1;
    this.animationNum[0] = (this.pos[1] > player.pos[1])*1;
  }
  cast(player, enemies, time, pursuitVector) {
    if(ENEMYDEBUG) {
      console.log("[Phantom] Casts a dark spell!");
    }
    enemies.push(new DarkSpell(this.pos, this.lockedZone, scaleVector(pursuitVector, this.spellSpeed), this.spellRange, this.spellDamage, this.collisionMap));
  }
}

class Bone extends EnemyProjectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Piercing", 0.2, false, 0, 0, null, _collisionMap, textures.boneTileSet);
  }
}

class DarkSpell extends EnemyProjectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Necrotic", 0.5, false, 3, 4, "Necrotic", _collisionMap, textures.darkSpellTileSet);
    let angle = atan(Math.abs(_dir[1]/_dir[0]));
    if(angle < PI/6){
      this.animationNum[0] = 0;
    }
    else if(angle < PI/3){
      this.animationNum[0] = 2;
    }
    else{
      this.animationNum[0] = 1;
    }
    this.animationNum[1] = _dir[0] > 0 && this.animationNum[0] !== 1 ? 0:1;
    this.animationNum[2] = _dir[1] < 0 && this.animationNum[0] !== 0 ? 0:1;
  }
}