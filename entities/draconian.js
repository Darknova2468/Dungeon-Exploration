/* eslint-disable no-undef */
class Draconian extends Enemy {
  constructor(_pos, _roomId, _level, _collisionMap, _textureSet = "purple") {
    super(_pos, "Draconian", _roomId, _level, _level + 10, 20, 3, 20, 5, _level, "Slashing", 1.2, 700, _collisionMap, _textureSet);

    // Proficient fighters with periodic breath attacks
    this.breathCooldown = 8000;
    this.breathTimer = millis();
    this.breathStall = 1000;
  }

  updateBreathAttack() {

  }

  initiateBreathAttack() {
    this.breathTimer = millis();
  }

  combat(player, enemies, time, distance, pursuitVector) {
    this.updateBreathAttack();
    if(millis() - this.breathTimer > this.breathCooldown) {
      this.initiateBreathAttack();
    }
    else if(millis() - this.breathTimer < this.breathStall) {
      return;
    }
    else if(distance <= this.attackRange && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 2, 3);
      weights.weighMomentum(this.prevDirection);
      weights.weighSocialDistancing(this.pos, enemies);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }
}