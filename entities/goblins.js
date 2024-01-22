/* eslint-disable no-undef */
class Goblin extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = textures.goblinTileSet, _animationSpeed, scaleFactor) {
    super(_pos, "Goblin", _roomId, _level, 4 + Math.floor(Math.pow(_level, 0.6)), 0, 3.5, 12, 2, 1 + Math.floor(_level / 30), "Slashing", 1, 700, _collisionMap, _textureSet, _animationSpeed, scaleFactor);

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

  damage(amountDamage, damageType) {
    // Redefined to drop more coins
    super.damage(amountDamage, damageType);
    if(!this.invincible && ["Piercing", "Slashing", "Bludgeoning"].includes(damageType)) {
      this.knockback = true;
    }
    if(!this.isAlive) {
      let netWorth = Math.floor(random(this.level) / Math.max(0.1, Math.sqrt(random(2))));
      while(netWorth > 0) {
        let amt = min(5, netWorth);
        myDungeon.otherEntities.push(new Coin(structuredClone(this.pos), amt, this.collisionMap));
        netWorth -= amt;
      }
    }
    this.thrusting = false;
    this.backing = true;
  }
}

class Booyahg extends Goblin {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.booyahgTileSet);
    this.combatBalanceRadius = 5;
    this.thrustRadius = 6;
    this.attackDamage *= 0.8;
    
    // Booyahgs are trickster spellcasters
    this.spellSpeed = 1;
    this.spellRange = 20;
    this.spellDamage = this.attackDamage;
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
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Lightning", 1, false, 0, 0, null, _collisionMap, textures.annoyingSparkTileSet);
    this.defaultSpeed = this.speed;
    this.sparkSpeed = 10;
    this.remainChance = 0.5;
    this.radius = 0.1;
    this.scaleFactor = 0.5;
    this.passive = true;
  }

  operate(target, enemies, time) {
    this.speed = this.sparkSpeed;
    this.move([random(-20, 20), random(-20, 20)], time);
    this.speed = this.defaultSpeed;
    if(!this.isAlive) {
      return;
    }
    this.move(this.dir, time);
    let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
    if(distance < this.hitRange + target.radius && millis() - this.hitTimer > this.hitCooldown) {
      this.hit(target, time);
      this.hitTimer = millis();
    }
    if(dist(this.pos[0], this.pos[1], this.initPos[0], this.initPos[1]) > this.maxDist) {
      this.isAlive = false;
    }
    if(!this.isAlive) {
      this.explode([target], time);
    }
  }

  hit(target, time) {
    target.damage(this.hitDamage, this.damageType);
    if(random() > this.remainChance) {
      this.isAlive = false;
    }
    else {
      this.remainChance += 0.1;
    }
  }
}

class Hobgoblin extends Goblin {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.hobgoblinTileSet);
    this.combatBalanceRadius = 3.5;
    this.thrustRadius = 4;
    this.attackDamage *= 2;
  }
}

const GOBLINVARIANTS = [Goblin, Hobgoblin, Booyahg];

function createGoblins(goblinDifficulty) {
  let hobgoblinVariantChance = 0;
  let booyahgVariantChance = 0;
  let goblins = [];
  goblinDifficulty *= 4;
  if(goblinDifficulty > 50) {
    booyahgVariantChance = 0.3;
  }
  if(goblinDifficulty > 100) {
    hobgoblinVariantChance = 0.4;
  }
  if(goblinDifficulty > 150) {
    hobgoblinVariantChance = 0.9;
  }
  while(goblinDifficulty > 0) {
    let goblinType = 0;
    let maxLevel = goblinDifficulty;
    if(random() < hobgoblinVariantChance) {
      goblinType = 1;
    }
    else if(random() < booyahgVariantChance) {
      goblinType = 2;
    }
    let reductionFactor = goblinType === 1 ? 1 : 2;
    let chosenLevel = Math.ceil(Math.pow(random(1, Math.pow(maxLevel, 1/reductionFactor)), reductionFactor));
    if(goblinType !== 1) {
      chosenLevel = Math.min(20, chosenLevel);
    }
    goblins.push([GOBLINVARIANTS[goblinType], chosenLevel, 1]);
    if(goblinType) {
      goblinDifficulty -= 1.5 * chosenLevel;
    }
    else {
      goblinDifficulty -= chosenLevel;
    }
  }
  return goblins;
}

class Warlord extends Goblin {
  constructor(_pos, _roomId, _collisionMap) {
    super(_pos, _roomId, 300, _collisionMap, textures.warLordTileSet, 4, 1.25);
    this.combatBalanceRadius = 4;
    this.thrustRadius = 5;
    this.radius = 0.9;
    this.maxHealth *= 4;
    this.health *= 4;
    this.healthBar.maxHealth = this.maxHealth;
    this.bossHealthBar = new WarlordHealthBar(this.maxHealth);
    this.healthStage = 0;
    this.warlordBossHealthBar = true;
  }

  combat(player, enemies, time, distance, pursuitVector) {
    super.combat(player, enemies, time, distance, pursuitVector);
    if(this.backing) {
      this.defence = 0;
      this.attackRange = 1;
    }
    else if(this.thrusting){
      this.defence = 5;
      this.attackRange = 2;
    }
    else {
      this.defence = 30;
      this.attackRange = 1;
    }
    if(this.health / this.maxHealth < 1 - this.healthStage / 4) {
      this.healthStage += 1;
      switch(this.healthStage) {
      case 2:
        for(let i = 0; i < 5; i++) {
          enemies.push(myDungeon.dungeon[this.lockedZone - 3].attemptEnemyPlacement(Goblin, 20, 0.5));
        }
        break;
      case 3:
        for(let i = 0; i < 5; i++) {
          enemies.push(myDungeon.dungeon[this.lockedZone - 3].attemptEnemyPlacement(Booyahg, 20, 0.5));
        }
        break;
      case 4:
        for(let i = 0; i < 5; i++) {
          enemies.push(myDungeon.dungeon[this.lockedZone - 3].attemptEnemyPlacement(Hobgoblin, 100, 0.5));
        }
        break;
      }
    }
  }

  display(screenCenter, screenSize) {
    super.display(screenCenter, screenSize);
    this.bossHealthBar.display(this.health);
  }
}