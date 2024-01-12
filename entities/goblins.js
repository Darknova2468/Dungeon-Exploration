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
    this.thrustChance = 0.02;
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

class Hobgoblin extends Goblin {
  constructor(_pos, _roomId, _level, _collisionMap) {
    super(_pos, _roomId, _level, _collisionMap, textures.hobgoblinTileSet);
    this.combatBalanceRadius = 3.5;
    this.thrustRadius = 4;
    this.attackDamage *= 1.5;
  }
}