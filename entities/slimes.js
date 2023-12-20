/* eslint-disable no-undef */
class Slime extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = textures.slimeTileSet) {
    super(_pos, "Slime", _roomId, _level, Math.floor(4*Math.log10(_level+1)), 0, 1.5, 8, 0.5, 1, "Bludgeoning", 0.5, 600, _collisionMap, _textureSet);

    // Jumping variables
    this.canJump = false;
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
      weights.weighObstacles(this.collisionMap, this.pos, 1, 5);
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
    this.lavaSlimeBalls.push(new LavaSlimeBall(this.pos, scaleVector(pursuitVector, this.lavaSlimeBallSpeed), this.lavaSlimeBallRange, this.lavaSlimeBallDamage, this.collisionMap));
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
  constructor(_pos, _dir, _maxDist, _hitDmg, _collisionMap) {
    super(_pos, _dir, _maxDist, _hitDmg, "Fire", 0.3, false, 0, 0, null, _collisionMap, textures.lavaSlimeBallTileSet);
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
    enemies.push(this.activeFrozenPuddle);
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