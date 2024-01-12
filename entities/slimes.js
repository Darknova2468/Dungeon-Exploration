/* eslint-disable no-undef */
class Slime extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = textures.slimeTileSet, _animationSpeed, _scaleFactor) {
    super(_pos, "Slime", _roomId, _level, Math.floor(4*Math.log10(_level+1)), 0, 1.5, 8, 0.5, Math.floor(4*Math.log10(_level+1)), "Bludgeoning", 0.5, 600, _collisionMap, _textureSet, _animationSpeed, _scaleFactor);
    if(this.level >= 10) {
      this.radius = 0.6;
    }

    if(this.level >= 25) {
      this.radius = 1;
    }

    // Jumping variables
    this.canJump = this.level < 10 ? false : true;
    this.jumping = false;
    this.defaultSpeed = this.speed;
    this.jumpSpeed = 4 * this.speed;
    this.jumpCooldown = 3000;
    this.jumpTime = 700 / this.defaultSpeed;
    this.jumpTimer = millis();
    this.jumpRange = 3;
    this.jumpSplashRadius = this.radius * 1.5;
    this.jumpSplashDamage = 3;
    this.jumpSplashDamageType = "Bludgeoning";
  }
  operate(player, enemies, time) {
    if(this.jumping) {
      this.jump(player, enemies, time);
    }
    else {
      super.operate(player, enemies, time);
    }
  }
  combat(player, enemies, time, distance, pursuitVector) {
    if(this.canJump && distance <= this.jumpRange
      && millis() - this.jumpTimer > this.jumpCooldown) {
      // Jump
      this.jump(player, enemies, time, distance);
    }
    if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 1, 5);
      // Retreat midpoint of -1e9 since slimes don't retreat
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius, -1e9);
      weights.weighMomentum(this.prevDirection);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
  jump(player, enemies, time, d = this.jumpRange) {
    if(!this.jumping) {
      this.jumpTimer = millis() + this.jumpTime * (d / this.jumpRange);
      this.jumping = true;
      this.speed = this.jumpSpeed;
    }
    if(millis() < this.jumpTimer) {
      this.move(this.prevDirection, time);
    }
    else {
      this.jumping = false;
      this.speed = this.defaultSpeed;
      this.splash(player, enemies, time);
    }
  }
  splash(player, enemies, time) {
    let distance = dist(player.pos[0], player.pos[1], this.pos[0], this.pos[1]);
    if(distance < this.jumpSplashRadius) {
      if(ENEMYDEBUG) {
        console.log("[Slime] Splash attacks!");
      }
      player.damage(this.jumpSplashDamage, this.jumpSplashDamageType);
    }
  }
}

class LavaSlime extends Slime {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.lavaSlimeTileSet);
    this.lavaSlimeBalls = [];
    this.lavaSlimeBallSpeed = 4;
    this.lavaSlimeBallRange = 4;
    this.lavaSlimeBallDamage = 3;
    this.combatBalanceRadius = 5;
    this.attackDamage = 0;
    this.canJump = true;
  }

  jump(player, enemies, time, d = this.jumpRange) {
    this.jumpTimer = millis();
    let pursuitVector = [player.pos[0] - this.pos[0], player.pos[1] - this.pos[1]];
    this.lavaSlimeBalls.push(new LavaSlimeBall(this.pos, this.lockedZone, scaleVector(pursuitVector, this.lavaSlimeBallSpeed), this.lavaSlimeBallRange, this.lavaSlimeBallDamage, this.collisionMap));
    if(ENEMYDEBUG) {
      console.log("[Lava Slime] Shot a lava slime ball!");
    }
  }

  operate(player, enemies, time) {
    super.operate(player, enemies, time);
    for(let lavaSlimeBall of this.lavaSlimeBalls) {
      lavaSlimeBall.operate([player], time);
    }
    this.lavaSlimeBalls = this.lavaSlimeBalls.filter((b) => b.isAlive);
  }

  display(screenCenter, screenSize) {
    super.display(screenCenter, screenSize);
    for(let lavaSlimeBall of this.lavaSlimeBalls) {
      lavaSlimeBall.display(screenCenter, screenSize);
    }
  }
}

class LavaSlimeBall extends Projectile {
  constructor(_pos, _zone, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _zone, _dir, _maxDist, _hitDmg, "Fire", 0.3, false, 0, 0, null, _collisionMap, textures.lavaSlimeBallTileSet);
  }
}

class FrostSlime extends Slime {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.frostSlimeTileSet);
    this.speed = 0;
    this.defaultSpeed = 0;
    this.canJump = true;
    this.activeFrozenPuddle = null;
  }

  splash(player, enemies, time) {
    super.splash(player, enemies, time);
    this.activeFrozenPuddle = new FrozenPuddle(this.pos, this.radius * 1.5, 1, 0.5 / this.level, this.collisionMap);
    enemies.unshift(this.activeFrozenPuddle);
  }

  operate(player, enemies, time) {
    super.operate(player, enemies, time);
    if(!this.jumping) {
      this.animationNum[0] = 0;
    }
    if(this.activeFrozenPuddle !== null) {
      this.activeFrozenPuddle.renew();
    }
  }
}

class FrozenPuddle extends Entity {
  constructor(_pos, _radius, _freezeDamage, _thawRate, _collisionMap) {
    super(structuredClone(_pos), 0, 0, 0, _collisionMap, textures.frozenPuddleTileSet);
    this.invincible = true;
    this.radius = _radius;
    this.freezeDamage = _freezeDamage;
    this.initialFreezeDamage = _freezeDamage;
    this.thawRate = _thawRate;
    this.hitTimer = millis();
    this.hitCooldown = 500;
    this.damageType = "Cold";
    this.passive = true;
  }

  operate(target, enemies, time) {
    this.freezeDamage -= this.thawRate * time;
    if(this.freezeDamage <= 0) {
      this.isAlive = false;
    }
    if(!this.isAlive) {
      return;
    }
    let distance = dist(target.pos[0], target.pos[1], this.pos[0], this.pos[1]);
    if(distance < this.radius && millis() - this.hitTimer > this.hitCooldown) {
      this.freeze(target, time);
      this.hitTimer = millis();
    }
  }
  freeze(target, time) {
    if(ENEMYDEBUG) {
      console.log("[Frozen Puddle] Freezing.");
    }
    target.damage(this.freezeDamage, this.damageType);
  }

  renew() {
    this.freezeDamage = this.initialFreezeDamage;
  }
}

const slimeVariants = [Slime, LavaSlime, FrostSlime];

function createSlimes(slimeDifficulty) {
  let lavaSlimeVariantChance = 0;
  let frostSlimeVariantChance = 0;
  let slimes = [];
  slimeDifficulty *= 5;
  if(slimeDifficulty > 50) {
    lavaSlimeVariantChance = 0.9;
  }
  if(slimeDifficulty > 100) {
    frostSlimeVariantChance = 0.8;
    lavaSlimeVariantChance = 0.3;
  }
  if(slimeDifficulty > 150) {
    frostSlimeVariantChance = 0.2;
    lavaSlimeVariantChance = 0.3;
  }
  while(slimeDifficulty > 0) {
    let slimeType = 0;
    let maxLevel = slimeDifficulty;
    if(random() < frostSlimeVariantChance) {
      slimeType = 2;
    }
    else if(random() < lavaSlimeVariantChance) {
      slimeType = 1;
    }
    if(slimeType) {
      maxLevel = slimeDifficulty / 2;
    }
    let chosenLevel = Math.ceil(Math.pow(random(0.1, Math.sqrt(maxLevel)), 2));
    slimes.push([slimeVariants[slimeType], chosenLevel, 1]);
    if(slimeType) {
      slimeDifficulty -= 2 * chosenLevel;
    }
    else {
      slimeDifficulty -= chosenLevel;
    }
  }
  return slimes;
}

class SlimeBoss extends Slime {
  constructor(_pos, _roomId, _collisionMap, _enemies) {
    super(_pos, _roomId, 100, _collisionMap, textures.slimeBossTileSet, 6, 2);
    this.radius = 2;
    this.attackRange = 2;
    this.health = 20;
    this.tentacles = [];
    this.canJump = false;
    this.detectionRange = 100;
    this.scaleFactor *= 2;
    for(let dx of [-3, 3]) {
      for(let dy of [-3, 3]) {
        let t = new SlimeTentacle([_pos[0] + dx, _pos[1] + dy], _roomId, _collisionMap);
        this.tentacles.push(t);
        _enemies.push(t);
      }
    }
  }

  move() {
    // Don't move
  }

  operate(player, enemies, time) {
    super.operate(player, enemies, time);
    this.tentacles = this.tentacles.filter((t) => t.isAlive);
    this.animationNum[0] = 0;
    this.animationSpeed = 6;
    this.animationNum[0] = 0;
    if(player.pos[0]<this.pos[0]){
      this.animationNum[1] = 1;
    }
    this.tentacles.forEach(tentacle => {
      if(tentacle.vulnerable){
        this.animationNum[0] = 1;
        this.animationSpeed = 12;
      }
    });
  }

  damage(amountDamage, damageType) {
    // damageType unused for now
    if(this.invincible) {
      return;
    }
    amountDamage *= 5/(this.defence + 5);
    this.health -= amountDamage;
    if(this.health <= 0 && !this.invincible) {
      if(this.tentacles.length === 0) {
        this.isAlive = false;
      }
      else {
        this.health = 20;
        let stunnedTentacle = random(this.tentacles);
        stunnedTentacle.stun(5000);
        console.log("Stunned!");
      }
    }
  }
}

class SlimeTentacle extends Slime {
  constructor(_pos, _roomId, _collisionMap) {
    super(_pos, _roomId, 100, _collisionMap, textures.slimeTentacleTileSet);
    this.radius = 1;
    this.suckers = [];
    this.attackRange = 10;
    this.attackDamage = 10;
    this.canJump = false;
    this.detectionRange = 25;
    this.isSlamming = false;
    this.vulnerable = false;
    this.stunnedTexture = textures.slimeTentacleStunnedTileSet;
    this.normalTexture = this.animationSet;
    this.vulnerableTimer = 0;
    this.targetSlamPos = [0, 0];
    this.slamCharge = 1500;
    this.slamDuration = 500;
    this.slamWidth = 2;
    this.initSlamColour = color(0, 100, 100, 100);
    this.finalSlamColour = color(150, 50, 50, 225);
    this.slamColour = color(0, 150, 255, 255);
    this.fadeSlamColour = color(0, 100, 100, 0);
    this.slamCooldown = 5000 + random(1, 3000);
    this.attackTimer = 0;
    this.maxSlimeSpawn = 5;
  }

  initiateSlamAttack(pos) {
    if(this.vulnerable) {
      return;
    }
    this.isSlamming = true;
    this.attackTimer = millis();
    let targetSlamDisp = scaleVector(pos, this.attackRange, this.pos);
    this.targetSlamPos = [this.pos[0] + targetSlamDisp[0], this.pos[1] + targetSlamDisp[1]];
    this.suckers.push(new LineWarnZone(this.pos, this.targetSlamPos, this.slamWidth, this.attackTimer, this.attackTimer + this.slamCharge, this.attackTimer + this.slamCharge + this.slamDuration, this.initSlamColour, this.finalSlamColour, this.slamColour, this.fadeSlamColour, this.collisionMap));
  }

  slam(player, enemies) {
    this.isSlamming = false;
    let d = checkBounds(player.pos[0], player.pos[1],
      this.pos[0], this.pos[1],
      this.targetSlamPos[0], this.targetSlamPos[1]);
    if(d !== -1 && d < this.slamWidth / 2) {
      player.damage(this.attackDamage, this.attackDamageType);
    }

    for(let i = 0; i < Math.floor(random(this.maxSlimeSpawn)); i++) {
      let r = random();
      let slime = new Slime([this.pos[0] * r + this.targetSlamPos[0] * (1-r), this.pos[1] * r + this.targetSlamPos[1] * (1-r)], this.lockedZone - 3, Math.floor(random(28)), this.collisionMap);
      if(slime.canMoveTo(this.collisionMap[Math.floor(slime.pos[1])][Math.floor(slime.pos[0])])) {
        enemies.push(slime);
      }
    }
  }

  stun(duration) {
    this.animationSet = this.stunnedTexture;
    this.vulnerable = true;
    this.isSlamming = false;
    this.suckers = [];
    this.vulnerableTimer = millis() + duration;
    this.invincible = false;
  }

  operate(player, enemies, time) {
    if(this.vulnerable && millis() > this.vulnerableTimer) {
      this.vulnerable = false;
      this.animationSet = this.normalTexture;
    }
    if(!this.vulnerable) {
      this.invincible = true;
    }
    super.operate(player, enemies, time);
    for(let sucker of this.suckers) {
      sucker.operate(player, time);
    }
    this.suckers = this.suckers.filter((b) => b.isAlive);
  }

  combat(player, enemies, time, distance, pursuitVector) {
    if(this.isSlamming) {
      if(millis() - this.attackTimer > this.slamCharge) {
        this.slam(player, enemies);
      }
    }
    else {
      if(distance <= this.attackRange && millis() - this.attackTimer > this.slamCharge + this.slamCooldown) {
        this.initiateSlamAttack(player.pos);
      }
    }
  }

  display(screenCenter, screenSize) {
    this.suckers.forEach((s) => {
      s.display(screenCenter, screenSize);
    });
    super.display(screenCenter, screenSize);
  }
}