/* eslint-disable no-undef */
class Zombie extends Enemy {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    // super(_pos, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, _collisionMap, _textureSet);
    super(_pos, "Zombie", _level, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, 10, 1, 2, "Bludgeoning", 1.5, 700, _collisionMap, _textureSet);

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
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  attack(player, time, distance) {
    super.attack(player, time);
    if(distance <= this.biteRadius) {
      player.damage(this.biteDamage, this.biteDamageType);
      console.log("[Zombie] Bites.");
    }
  }
}

class Skeleton extends Enemy {
  constructor(_pos, _level, _collisionMap, _textureSet, _projectileTexture) {
    // super(_pos, Math.floor(_level + 4), 2, 2.5, _collisionMap, _textureSet);
    super(_pos, "Skeleton", _level, Math.floor(_level + 4), 2, 2.5, 10, 6, 1, "Slashing", 1.5, 1000, _collisionMap, _textureSet);

    // I am Skeletor.
    this.retreatMidpoint = 4;
    this.throwRange = 8;
    this.throwTimer = millis();
    this.throwCooldown = 5000;
    this.throwStunTime = 1000;
    this.throwSpeed = 10;
    this.throwDamage = 10;
    this.projectileTexture = _projectileTexture;
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
      this.throw(player, enemies, time, pursuitVector);
      this.throwTimer = millis();
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
      // Skeletons keep their distance
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, this.retreatMidpoint);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  throw(player, enemies, time, pursuitVector) {
    console.log("[Skeleton] Throws a bone.");
    enemies.push(new Bone(this.pos, scaleVector(pursuitVector, this.throwSpeed), this.throwRange, this.throwDamage, this.collisionMap, this.projectileTexture));
  }
}

class Phantom extends Enemy {
  constructor(_pos, _level, _collisionMap, _textureSet) {
    super(_pos, "Skeleton", _level, Math.floor(_level + 4), 0, 3, 15, 8, 3, "Necrotic", 1.5, 1000, _collisionMap, _textureSet);

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
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  cast(player, enemies, time, pursuitVector) {
    console.log("[Phantom] Casts a dark spell!");
    enemies.push(new DarkSpell(this.pos, scaleVector(pursuitVector, this.spellSpeed), this.spellRange, this.spellDamage, this.collisionMap, "black"));
  }
}

class Bone extends EnemyProjectile {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, "Piercing", 0.5, false, 0, 0, null, _collisionMap, _textureSet);
  }
}

class DarkSpell extends EnemyProjectile {
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap, _textureSet) {
    super(_pos, _dir, _maxDist, _hitDmg, "Necrotic", 1, false, 3, 4, "Necrotic", _collisionMap, _textureSet);
  }
}