/* eslint-disable no-undef */
class Goblin extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = textures.goblinTileSet) {
    // super(_pos, _level + 4, 0, 4.5, _collisionMap, _textureSet);
    super(_pos, "Goblin", _roomId, _level, _level + 4, 0, 4.5, 12, 2, 3, "Slashing", 1, 700, _collisionMap, _textureSet);

    // Goblin bully tactics
    this.thrustRadius = 3;
    this.thrusting = false;
    this.backing = false;
    this.fleeing = false;
    this.thrustChance = 0.01;
  }
  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.thrusting = false;
      this.backing = true;
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3);
      weights.weighMomentum(this.prevDirection);
      if(distance > this.combatBalanceRadius) {
        this.backing = false;
      }

      // Thrust
      if(!this.backing && !this.fleeing && distance < this.thrustRadius && random() < this.thrustChance) {
        this.thrusting = true;
      }
      if(this.thrusting) {
        weights.weighPursuitVector(pursuitVector);
      }

      // Back off or flee
      else if(this.backing || this.fleeing) {
        weights.weighPursuitVector(pursuitVector, -1);
      }
      else {
        weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
        weights.weighSocialDistancing(this.pos, enemies);
        weights.weighTargetDirection(player, 2 / distance);
      }
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
  idle(time) {
    this.thrusting = false;
    this.backing = false;
    this.fleeing = false;
  }
}

class Booyahg extends Goblin {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.booyahgTileSet);
    this.combatBalanceRadius = 5;
    this.thrustRadius = 6;
    this.attackDamage *= 0.25;
    
    // Booyahgs are trickster spellcasters
    this.spellSpeed = 1;
    this.spellRange = 20;
    this.spellDamage = 1;
  }

  combat(player, enemies, time, distance, pursuitVector) {
    super.combat(player, enemies, time, distance, pursuitVector);
    if(this.thrusting && random() < 0.2) {
      this.thrusting = false;
      this.backing = true;
      enemies.push(new AnnoyingSpark(this.pos, this.lockedZone, scaleVector(pursuitVector, this.spellSpeed), this.spellRange, this.spellDamage, this.collisionMap));
    }
  }
}

class AnnoyingSpark extends EnemyProjectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Lightning", 0.1, false, 0, 0, null, _collisionMap, textures.annoyingSparkTileSet);
    this.defaultSpeed = this.speed;
    this.sparkSpeed = 10;
  }

  operate(target, enemies, time) {
    this.speed = this.sparkSpeed;
    this.move([random(-20, 20), random(-20, 20)], time);
    this.speed = this.defaultSpeed;
    super.operate(target, enemies, time);
  }
}

class Hobgoblin extends Goblin {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.hobgoblinTileSet);
    this.combatBalanceRadius = 3.5;
    this.thrustRadius = 4;
    this.attackDamage *= 1.5;
  }
}

const goblinVariants = [Goblin, Hobgoblin, Booyahg];

function createGoblins(goblinDifficulty) {
  let hobgoblinVariantChance = 0;
  let booyahgVariantChance = 0;
  let goblins = [];
  goblinDifficulty *= 5;
  if(goblinDifficulty > 50) {
    hobgoblinVariantChance = 0.9;
  }
  if(goblinDifficulty > 100) {
    booyahgVariantChance = 0.8;
    hobgoblinVariantChance = 0.3;
  }
  if(goblinDifficulty > 150) {
    booyahgVariantChance = 0.2;
    hobgoblinVariantChance = 0.3;
  }
  while(goblinDifficulty > 0) {
    let goblinType = 0;
    let maxLevel = goblinDifficulty;
    if(random() < booyahgVariantChance) {
      goblinType = 2;
    }
    else if(random() < hobgoblinVariantChance) {
      goblinType = 1;
    }
    if(goblinType) {
      maxLevel = goblinDifficulty / 2;
    }
    let chosenLevel = Math.ceil(Math.pow(random(0.1, Math.sqrt(maxLevel)), 2));
    goblins.push([goblinVariants[goblinType], chosenLevel, 1]);
    if(goblinType) {
      goblinDifficulty -= 2 * chosenLevel;
    }
    else {
      goblinDifficulty -= chosenLevel;
    }
  }
  return goblins;
}