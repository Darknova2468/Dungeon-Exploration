/* eslint-disable no-undef */
class Zombie extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap) {
    // super(_pos, Math.floor(10 + Math.pow(_level, 0.5)/5), Math.floor(4*Math.log10(_level+1)), 1.2, _collisionMap, _textureSet);
    super(_pos, "Zombie", _roomId, _level, Math.floor(10 + Math.pow(_level, 0.7)), Math.floor(Math.log(_level+1)), 1.2, 10, 1, 2, "Bludgeoning", 1.2, 700, _collisionMap, textures.zombieTileSet);
    this.radius = 0.4;

    // Zombies stop when attacking and bite if close; also quite heavy
    this.isMoving = 0;
    this.strafeMultiplier = -1;
    this.biteRadius = 0.7;
    this.biteDamage = 2;
    this.biteDamageType = "Piercing";
    this.shoveTime = 200;
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
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3); // Tweak for different AI
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
    super(_pos, "Skeleton", _roomId, _level, Math.floor(10 + Math.pow(_level, 0.7)), 2, 2.5, 10, 6, 1, "Slashing", 1, 1000, _collisionMap, textures.skeletonTileSet);

    // I am Skeletor.
    this.retreatMidpoint = 4;
    this.throwRange = 8;
    this.throwTimer = millis();
    this.throwCooldown = 5000;
    this.throwStunTime = 1000;
    this.throwSpeed = 10;
    this.throwDamage = 10 + Math.floor(Math.sqrt(_level));
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
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3); // Tweak for different AI
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
    super(_pos, "Phantom", _roomId, _level, Math.floor(5 + Math.pow(_level, 0.8)), 0, 2, 15, 8, 3, "Necrotic", 1.5, 1000, _collisionMap, textures.phantomTileSet);

    // Necrotic spellcaster
    this.retreatMidpoint = 6;
    this.spellRange = 8;
    this.spellTimer = millis();
    this.spellCooldown = 7000;
    this.spellSpeed = 5;
    this.spellDamage = Math.floor(Math.pow(this.level, 0.4));
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
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3); // Tweak for different AI
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

  explode(targets, time) {
    for(let target of targets) {
      let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
      if(distance < this.explosionRadius) {
        target.damage(this.explosionDamage, this.explosionDamageType);
        player.blindnessTimer = max(player.blindnessTimer, millis() + 4000);
      }
      else if(distance < this.explosionRadius + target.radius) {
        target.damage(this.explosionDamage / 2, this.explosionDamageType);
        player.blindnessTimer = max(player.blindnessTimer, millis() + 2000);
      }
    }
    myDungeon.dungeon[this.lockedZone - 3].enemies.push(new DiskWarnZone(this.pos, this.explosionRadius, 0, millis(), millis() + 1000, color(0,0,0,0), color(0,0,0,0), color(0,0,0,255), color(0,0,0,0), this.collisionMap));
  }
}

const undeadVariants = [Zombie, Skeleton, Phantom];

function createUndead(undeadDifficulty) {
  let skeletonChance = 0;
  let phantomChance = 0;
  let undead = [];
  undeadDifficulty *= 2;
  if(undeadDifficulty > 50) {
    skeletonChance = 0.4;
  }
  if(undeadDifficulty > 100) {
    phantomChance = 0.1;
  }
  if(undeadDifficulty === 150) {
    phantomChance = 0.3;
  }
  while(undeadDifficulty > 0) {
    let undeadType = 0;
    let maxLevel = undeadDifficulty;
    if(random() < phantomChance) {
      undeadType = 2;
    }
    else if(random() < skeletonChance) {
      undeadType = 1;
    }
    if(undeadType) {
      maxLevel = undeadDifficulty / 2;
    }
    let chosenLevel = Math.ceil(Math.pow(random(1, Math.sqrt(maxLevel)), 1.5));
    undead.push([undeadVariants[undeadType], chosenLevel, 1]);
    undeadDifficulty -= (1 + undeadType) * chosenLevel;
  }
  return undead;
}

/**
 * The Necromancer King.
 * 
 * This boss has three attacks, all of which inflict blindness:
 * - [Wave] Summons a large wave of zombies, not unlike the tentacle slam attack
 *     (but not actually slamming this time)
 * - [Circle] Summons a large skeleton circle around the player
 * - [Teleport] 20% chance to summon a phantom at a random location and teleport nearby the phantom when hit
 * 
 * The boss also pulsates darkness; the frequency increases as the boss health gets lower.
 */
class NecromancerKing extends Phantom {
  constructor(_pos, _roomId, _collisionMap) {
    super(_pos, _roomId, 300, _collisionMap);
    this.detectionRange = 200;

    // All attacks (visuals)
    this.castColour = color(0, 0, 0, 255);
    this.fadeCastColour = color(93, 63, 211, 0);
    this.castDuration = 1000;
    this.spells = [];

    // Zombie wave attack
    this.initWaveColour = color(105, 131, 98, 0);
    this.waveCharge = 1000;
    this.waveCharging = false;
    this.waveWidth = 3;
    this.waveLength = 20;
    this.maxWaveSpawn = 20;
    this.waveBlindnessDuration = 2000;
    this.waveCooldown = 7000;
    this.waveTimer = 0;
    this.waveStart = [0, 0];
    this.waveEnd = [0, 0];
    
    // Skeleton circle attack
    this.initCircleColour = color(255, 255, 255, 0);
    this.circleRadius = 5;
    this.circleCharge = 2000;
    this.circleCharging = false;
    this.maxCircleSpawn = 10;
    this.circleBlindnessDuration = 2000;
    this.circleCooldown = 12000;
    this.circleTimer = millis();
    this.circlePos = [0, 0];

    // Phantom teleportation
    this.teleportBlindnessDuration = 500;
    this.teleportCooldown = 10000;
    this.teleportTimer = 0;
    this.teleportPos = [0, 0];
    this.teleportCasting = false;
    this.teleportChance = 0.2;

    // Darkness pulsation
    this.minDarknessPeriod = 500;
    this.maxDarknessPeriod = 5000;
    this.updateDarknessPeriod();
  }

  updateDarknessPeriod() {
    let portion = this.health / this.maxHealth;
    if(portion <= 0) {
      return;
    }
    this.darknessPeriod = this.maxDarknessPeriod * portion;
  }

  displayPlayerDarknessPortion(player) {
    player.visionPortion = (2 + Math.sin(2 * Math.PI * millis() / this.darknessPeriod)) / 3;
  }

  prepareWaveSpell(player) {
    this.waveStart = structuredClone(this.pos);
    let targetDisp = scaleVector(player.pos, this.waveLength, this.pos);
    this.waveEnd = [this.pos[0] + targetDisp[0], this.pos[1] + targetDisp[1]];
    this.spells.push(new LineWarnZone(this.waveStart, this.waveEnd, this.waveWidth, millis(), millis() + this.waveCharge, millis() + this.waveCharge + this.castDuration, this.initWaveColour, this.castColour, this.castColour, this.fadeCastColour, this.collisionMap));
  }

  castWaveSpell(player, enemies) {
    let d = checkBounds(player.pos[0], player.pos[1],
      this.waveStart[0], this.waveStart[1],
      this.waveEnd[0], this.waveEnd[1]);
    if(d !== -1 && d < this.waveWidth / 2) {
      player.blindnessTimer = max(player.blindnessTimer, millis() + this.waveBlindnessDuration);
    }
    for(let i = 0; i < this.maxWaveSpawn; i++) {
      let r = random();
      let zombie = new Zombie([this.waveStart[0] * r + this.waveEnd[0] * (1-r), this.waveStart[1] * r + this.waveEnd[1] * (1-r)], this.lockedZone - 3, Math.floor(random(150, 200)), this.collisionMap);
      if(verifyIndices(this.collisionMap, Math.floor(zombie.pos[1]), Math.floor(zombie.pos[0])) && zombie.canMoveTo(this.collisionMap[Math.floor(zombie.pos[1])][Math.floor(zombie.pos[0])])) {
        enemies.push(zombie);
      }
    }
  }

  prepareCircleSpell(player) {
    this.circlePos = structuredClone(player.pos);
    this.spells.push(new DiskWarnZone(this.circlePos, this.circleRadius, millis(), millis() + this.circleCharge, millis() + this.circleCharge + this.castDuration, this.initCircleColour, this.castColour, this.castColour, this.fadeCastColour, this.collisionMap));
  }

  castCircleSpell(player, enemies) {
    let d = dist(player.pos[0], player.pos[1], this.circlePos[0], this.circlePos[1]);
    if(d !== -1 && d < this.circleRadius) {
      player.blindnessTimer = max(player.blindnessTimer, millis() + this.circleBlindnessDuration);
    }
    for(let i = 0; i < this.maxCircleSpawn; i++) {
      let r = random(2 * Math.PI);
      let skeleton = new Skeleton([this.circlePos[0] + this.circleRadius * Math.sin(r), this.circlePos[1] + this.circleRadius * Math.cos(r)], this.lockedZone - 3, Math.floor(random(150, 200)), this.collisionMap);
      if(verifyIndices(this.collisionMap, Math.floor(skeleton.pos[1]), Math.floor(skeleton.pos[0])) && skeleton.canMoveTo(this.collisionMap[Math.floor(skeleton.pos[1])][Math.floor(skeleton.pos[0])])) {
        enemies.push(skeleton);
        skeleton.throwTimer = 0;
      }
    }
  }

  castTeleportationSpell(player, enemies) {
    player.blindnessTimer = max(player.blindnessTimer, millis() + this.teleportBlindnessDuration);
    let phantom = myDungeon.dungeon[this.lockedZone - 3].attemptEnemyPlacement(Phantom, Math.floor(random(150, 200)), 1);
    this.pos = [phantom.pos[0], phantom.pos[1] + 0.05];
    enemies.push(phantom);
  }

  combat(player, enemies, time, distance, pursuitVector) {
    // Wave attacks
    if(millis() - this.waveTimer > this.waveCooldown) {
      this.waveTimer = this.waveCharge + millis();
      this.waveCharging = true;
      this.prepareWaveSpell(player);
    }
    else if(millis() > this.waveTimer && this.waveCharging) {
      this.waveCharging = false;
      this.castWaveSpell(player, enemies);
    }
    if(millis() - this.circleTimer > this.circleCooldown) {
      this.circleTimer = this.circleCharge + millis();
      this.circleCharging = true;
      this.prepareCircleSpell(player);
    }
    else if(millis() > this.circleTimer && this.circleCharging) {
      this.circleCharging = false;
      this.castCircleSpell(player, enemies);
    }
    if(this.teleportCasting) {
      this.teleportCasting = false;
      this.teleportTimer = millis() + this.teleportCooldown;
      this.castTeleportationSpell(player, enemies);
    }
    super.combat(player, enemies, time, distance, pursuitVector);
    for(let spell of this.spells) {
      spell.operate(player, time);
    }
    this.spells = this.spells.filter((spell) => spell.isAlive);
  }

  display(screenCenter, screenSize) {
    this.spells.forEach((spell) => {
      spell.display(screenCenter, screenSize);
    });
    super.display(screenCenter, screenSize);
    this.displayPlayerDarknessPortion(player);
  }

  damage(amountDamage, damageType) {
    super.damage(amountDamage, damageType);
    if(millis() > this.teleportTimer && random() < this.teleportChance) {
      this.teleportCasting = true;
    }
    if(!this.isAlive) {
      player.visionPortion = 1;
    }
  }
}