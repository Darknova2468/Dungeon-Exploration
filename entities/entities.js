/* eslint-disable no-undef */

/**
 * These are all the types of entities that are generic or don't fall under
 *   other files.
 */

const baseResolution = [24, 24];
const ENEMYDEBUG = 0;
const SHOWHITBOXES = false;
const DEFAULTPLAYERHEALTH = 10;

class Entity {
  constructor(_pos, _health, _defence, _speed, _collisionMap, _animationSet,
    _animationSpeed, _scaleFactor){
    // Basic declarations
    this.pos = _pos;
    this.maxHealth = _health;
    this.health = _health;
    this.defence = _defence;
    this.speed = _speed;
    this.collisionMap = _collisionMap;
    this.animationSet = _animationSet;
    this.animationNum = [0, 0, 0];
    this.isAlive = true;
    this.animationSpeed = _animationSpeed ?? 4;
    this.invincible = false;
    this.invisible = false;
    this.radius = 0.3;
    this.passive = false; // Only used for things like frozen puddles
    this.scaleFactor = _scaleFactor ?? 1;

    // Zone locking
    this.locked = false;
    this.lockedZone = 0;
    this.rotationOffset = 0;
  }

  /**
   * Determines whether an entity can move to a new zone.
   * @param {number} newZone The zone to move to.
   * @returns Whether the entity can move there.
   */
  canMoveTo(newZone) {
    if(!this.locked) {
      return newZone !== 0;
    }
    else {
      return newZone === this.lockedZone;
    }
  }

  /**
   * Displays the entity.
   */
  display(screenCenter, screenSize){
    if(this.invisible) {
      return;
    }
    let [x, y] = [this.pos[0] - screenCenter[0], this.pos[1] - screenCenter[1]];
    let posScaleX = width/screenSize[0];
    let posScaleY = height/screenSize[1];
    x += screenSize[0]*0.5;
    y += screenSize[1]*0.5;
    try{
      imageMode(CENTER);
      let imgScaleX = width/(screenSize[0]*baseResolution[0]/this.animationSet.size[0])*this.scaleFactor;
      let imgScaleY = height/(screenSize[1]*baseResolution[1]/this.animationSet.size[1])*this.scaleFactor;
      push();
      translate(x*posScaleX, y*posScaleY);
      if(SHOWHITBOXES) {
        fill("gray");
        circle(0, 0 , posScaleX*2*this.radius);
      }
      rotate(this.rotationOffset);
      scale(1-2*(this.animationNum[1] === 1), 1-2*(this.animationNum[2] === 1));
      image(this.animationSet.animations[this.animationNum[0]][Math.floor(frameCount/this.animationSpeed)%this.animationSet.animations[this.animationNum[0]].length], 0, 0, imgScaleX, imgScaleY);
      scale(1-2*(this.animationNum[1] === 1), 1-2*(this.animationNum[2] === 1));
      pop();
    }
    catch{
      fill(this.animationSet);
      circle(x*posScaleX, y*posScaleY, posScaleX*2*this.radius);
    }
    if(this.hasHealthBar){
      this.healthBar.display(this.pos, this.health, screenCenter, screenSize); 
    }
    else if(this.slimeBossHealthBar){
      this.healthBar.display(this.health, this.tentacles.length);
    }
    else if(this.warlordBossHealthBar){
      this.healthBar.display(this.health);
    }
  }

  /**
   * Damages the entity.
   * @param {number} amountDamage The damage amount.
   * @param {string} damageType The damage type.
   */
  damage(amountDamage, damageType) {
    if(this.invincible) {
      return;
    }
    amountDamage *= 5/(this.defence + 5);
    this.health -= amountDamage;
    if(this.health <= 0 && !this.invincible) {
      this.isAlive = false;
      this.health = 0;
    }
    sfx.hitSound.play();
    try {
      myDungeon.otherEntities.push(new Damage([this.pos[0], this.pos[1] - 0.6*this.animationSet.size[1]*this.scaleFactor/baseResolution[1]], amountDamage));
    }
    catch {
      myDungeon.otherEntities.push(new Damage([this.pos[0], this.pos[1] - 1.2*this.radius*this.scaleFactor], amountDamage));
    }
  }
}

/**
 * The portal, a type of otherentity.
 */
class Portal extends Entity {
  constructor(_pos, _radius, _floor, _collisionMap, _textureSet) {
    super(_pos, 1, 0, 0, _collisionMap, _textureSet, 3, 2);
    this.invincible = true;
    this.floor = _floor; // Floor available to go to once activated
    this.radius = _radius;
    this.active = false;
  }

  activate() {
    this.active = true;
    // this.animationSet = this.activeAnimationSet;
    this.animationNum[0] = 1;
  }

  operate(player, time) {
    if(this.active && dist(this.pos[0], this.pos[1], player.pos[0], player.pos[1]) < this.radius 
      && keyIsDown(32)) {
      // myDungeon = createDungeonMap(this.target);
      // enterDungeonMap(myDungeon);
      menuManager.menus.push(new PortalMenu(this.floor));
    }
  }
}

/**
 * Warn zones show where AoE effects are.
 */
class WarnZone extends Entity {
  constructor(_pos, _timerInit, _timerFinal, _timerFade, _colInit, _colFinal,
    _colExecution, _colFade, _collisionMap) {
    super(_pos, 1, 0, 0, _collisionMap, null);
    // A bunch of timers
    this.timerInit = _timerInit;
    this.timerFinal = _timerFinal;
    this.timerFade = _timerFade;
    this.timeInterval = _timerFinal - _timerInit;
    this.timeFadeInterval = _timerFade - _timerFinal;

    // Colours colours colours!
    this.colInit = _colInit;
    this.colFinal = _colFinal;
    this.colExecution = _colExecution;
    this.colFade = _colFade;
    this.colour = this.colInit;

    this.invincible = true;
  }

  operate(player, time) {
    // Note that both parameters are unused
    // Check alive
    if(millis() > this.timerFade) {
      this.isAlive = false;
    }
    else if(millis() > this.timerFinal) {
      // Get weights
      let finalPortion = (millis() - this.timerFinal) / this.timeFadeInterval;
      let initPortion = 1 - finalPortion;
      // Very complicated colour calculation
      this.colour = color(Math.floor(initPortion * red(this.colExecution)
        + finalPortion * red(this.colFade)),
        Math.floor(initPortion * green(this.colExecution)
        + finalPortion * green(this.colFade)),
        Math.floor(initPortion * blue(this.colExecution)
        + finalPortion * blue(this.colFade)),
        Math.floor(initPortion * alpha(this.colExecution)
        + finalPortion * alpha(this.colFade)));
    }
    else {
      // Get weights
      let finalPortion = (millis() - this.timerInit) / this.timeInterval;
      let initPortion = 1 - finalPortion;
      // Almost identical very complicated colour calculation
      this.colour = color(Math.floor(initPortion * red(this.colInit)
        + finalPortion * red(this.colFinal)),
        Math.floor(initPortion * green(this.colInit)
        + finalPortion * green(this.colFinal)),
        Math.floor(initPortion * blue(this.colInit)
        + finalPortion * blue(this.colFinal)),
        Math.floor(initPortion * alpha(this.colInit)
        + finalPortion * alpha(this.colFinal)));
    }
  }
}

/**
 * Linear warn zone.
 */
class LineWarnZone extends WarnZone {
  constructor(_pos, _targetPos, _width, _timerInit, _timerFinal, _timerFade, _colInit, _colFinal, _colExecution, _colFade, _collisionMap) {
    super(_pos, _timerInit, _timerFinal, _timerFade, _colInit, _colFinal, _colExecution, _colFade, _collisionMap);
    this.targetPos = _targetPos;
    this.width = _width;
  }

  display(screenCenter, screenSize) {
    let [posX, posY] = dungeonToScreenPos(this.pos, screenCenter, screenSize);
    let [targetX, targetY] = dungeonToScreenPos(this.targetPos, screenCenter, screenSize);
    stroke(this.colour);
    strokeWeight(this.width*width/screenSize[0]);
    line(posX, posY, targetX, targetY);
    strokeWeight(1);
    noStroke(0);
  }
}

/**
 * Circular warn zone.
 */
class DiskWarnZone extends WarnZone {
  constructor(_pos, _radius, _timerInit, _timerFinal, _timerFade, _colInit, _colFinal, _colExecution, _colFade, _collisionMap) {
    super(_pos, _timerInit, _timerFinal, _timerFade, _colInit, _colFinal, _colExecution, _colFade, _collisionMap);
    this.radius = _radius;
  }

  display(screenCenter, screenSize) {
    let [posX, posY] = dungeonToScreenPos(this.pos, screenCenter, screenSize);
    noStroke();
    fill(this.colour);
    circle(posX, posY, 2 * this.radius * width / screenSize[0]);
  }
}

/**
 * An enemy with way too many parameters, most of which are necessary
 */
class Enemy extends Entity {
  constructor(_pos, _name, _roomId, _level, _health, _defence, _speed,
    _detectionRange, _combatBalanceRadius, _attackDamage, _attackDamageType,
    _attackRange, _attackCooldown, _collisionMap, _textureSet, _animationSpeed,
    _scaleFactor, _hasHealthBar) {
    super(_pos, _health, _defence, _speed, _collisionMap, _textureSet,
      _animationSpeed, _scaleFactor);

    // Default parameters
    this.name = _name;
    this.level = _level;

    // Combat and attacks
    this.detectionRange = _detectionRange;
    this.combatBalanceRadius = _combatBalanceRadius;
    this.attackDamage = _attackDamage;
    this.attackDamageType = _attackDamageType;
    this.attackRange = _attackRange;
    this.attackTimer = millis();
    this.attackCooldown = _attackCooldown;
    this.prevDirection = [0, 0];

    // Locked zone info
    this.locked = true;
    this.lockedZone = _roomId + 3;

    // Health bars
    this.hasHealthBar = _hasHealthBar === undefined ? true:_hasHealthBar;
    if(this.hasHealthBar){
      try{
        this.healthBar = new EnemyHealthBar(_pos, _health,
          (this.animationSet.size[1]*0.5+0.125)/baseResolution[1],
          this.animationSet.size[0] /baseResolution[0]);
      }
      catch {
        this.healthBar = new EnemyHealthBar(_pos, _health, this.radius+0.25,
          this.radius);
      }
    }

    // Knockback variables
    this.knockback = false;
    this.shoveTimer = millis();
    this.shoveTime = 500;
    this.shoveSpeed = 2;
    this.shoveDir = [1, 0];
  }

  /**
   * Initiate knockback.
   */
  beginShove(player) {
    if(this.knockback) {
      this.knockback = false;
      this.shoveTimer = millis() + this.shoveTime;
      this.shoveDir = scaleVector(this.pos, this.shoveSpeed, player.pos);
    }
  }

  /**
   * Continues an initiated knockback.
   */
  shove(time) {
    let [dx, dy] = scaleVector(this.shoveDir, this.shoveSpeed * time);
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1])]
      [floor(this.pos[0]+dx)])){
      this.pos[0] += dx;
    }
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1]+dy)]
      [floor(this.pos[0])])){
      this.pos[1] += dy;
    }
  }

  /**
   * Operates the enemy, including if the enemy is idle.
   */
  operate(player, enemies, time) {
    this.beginShove(player);
    if(this.shoveTimer > millis()) {
      this.shove(time);
      return;
    }
    let distance = dist(player.pos[0], player.pos[1], this.pos[0],
      this.pos[1]);
    let pursuitVector = [player.pos[0] - this.pos[0],
      player.pos[1] - this.pos[1]];
    if(distance > this.detectionRange) {
      this.isMoving = 0;
      this.idle(time);
    }
    else {
      this.isMoving = 1;
      this.combat(player, enemies, time, distance, pursuitVector);
    }
  }

  /**
   * Combat if the enemy is not idle.
   */
  combat(player, enemies, time, distance, pursuitVector) {
    if(distance <= this.attackRange
      && millis() - this.attackTimer > this.attackCooldown) {
      // Attack
      this.attack(player, time);
      this.attackTimer = millis();
    }
    else {
      // Chase
      let weights = new Weights();
      weights.weighObstacles(this.collisionMap, this.lockedZone, this.pos, 
        2, 3);
      weights.weighMomentum(this.prevDirection);
      weights.weighBalancedApproach(pursuitVector, this.combatBalanceRadius);
      let maxDir = weights.getMaxDir();
      this.prevDirection = maxDir;
      this.move(maxDir, time);
    }
  }

  /**
   * Attacks the player.
   */
  attack(player, time) {
    if(ENEMYDEBUG) {
      console.log(`[${this.name}] Attacks.`);
    }
    player.damage(this.attackDamage, this.attackDamageType);
  }

  /**
   * Nonexistant idle behaviour.
   */
  idle(time) {

  } 

  /**
   * Moves in a given direction, bounded by speed.
   */
  move(pos, time){
    let [dx, dy] = scaleVector(pos, this.speed * time);
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1])]
      [floor(this.pos[0]+dx)])){
      this.pos[0] += dx;
    }
    if(this.canMoveTo(this.collisionMap[floor(this.pos[1]+dy)]
      [floor(this.pos[0])])){
      this.pos[1] += dy;
    }
  }

  /**
   * Enemy damage behaviour
   */
  damage(amountDamage, damageType) {
    super.damage(amountDamage, damageType);
    // Knockback if damage type is conventional
    if(!this.invincible && ["Piercing", "Slashing", "Bludgeoning"]
      .includes(damageType)) {
      this.knockback = true;
    }

    // Drops money upon death
    if(!this.isAlive) {
      let netWorth = Math.floor(random(this.level));
      while(netWorth > 0) {
        let amt = min(5, netWorth);
        myDungeon.otherEntities.push(new Coin(structuredClone(this.pos), amt,
          this.collisionMap));
        netWorth -= amt;
      }
    }
  }
}

/**
 * The player
 */
class Player extends Entity {
  constructor(_pos, _collisionMap){
    super(_pos, DEFAULTPLAYERHEALTH, 0, 3.5, _collisionMap, textures.playerTileSet);
    this.rollSpeed = 5;
    this.defaultSpeed = 3.5;
    this.movementDirection = [0, 0]; // Unrelated to texturing
    this.holdingIndex = 0;
    this.totalMoney = getItem("totalMoney");
    if(this.totalMoney === null) {
      this.totalMoney = 0;
    }
    this.money = this.totalMoney;
    this.speedBonus = 0;
    this.healthBonus = 0;

    // Inventory
    this.inventory = new Inventory(this);
    this.inventory.storage[0].holding = new Dagger(this);
    this.inventory.storage[1].holding = new Candle(this);
    this.updateHolding();
    
    // Attack/use cooldowns
    this.attackTimer = millis();

    // Zone stuff
    this.activeZone = -1;
    this.timeLocked = false;

    // Lighting and exploration
    this.defaultVision = 1;
    this.visionModifier = 0;
    this.visionPortion = 1; // Only used by powerful foes
    this.blindnessTimer = millis();
    this.updateVision(myDungeon);
  }

  /**
   * Updates the player's vision effect.
   */
  updateVision(dungeonMap) {
    this.visionModifier = 0;
    for(let cell of this.inventory.hotbar) {
      let item = cell.holding;
      if(item === null) {
        continue;
      }
      this.visionModifier += item.lightValue;
      if(this.holding === item) {
        this.visionModifier += item.lightValue;
      }
    }
    this.visionModifier = Math.pow(this.visionModifier, 0.7);
    if(dungeonMap.floorNumber === 0) {
      this.floorVision = 255;
    }
    else {
      this.floorVision = Math.max(this.visionModifier + this.defaultVision, 1);
    }
    this.vision = this.floorVision;
  }

  /**
   * Updates the player's held slot.
   */
  updateHolding() {
    this.holding = this.inventory.storage[this.holdingIndex].holding;
    this.updateVision(myDungeon);
  }

  /**
   * Updates the player's armor stats.
   */
  updateArmor() {
    this.defence = 0;
    this.healthBonus = 0;
    this.speedBonus = 0;
    for(let cell of this.inventory.wearing) {
      let piece = cell.holding;
      if(piece === null) {
        continue;
      }
      piece.updateStats();
      this.healthBonus += piece.health;
      this.defence += piece.defence;
      this.speedBonus += piece.speed;
    }
    this.maxHealth = DEFAULTPLAYERHEALTH + this.healthBonus;
    if(myDungeon.floorNumber === 0) {
      this.health = this.maxHealth;
    }
  }

  /**
   * Moves in a certain direction, bounded by speed.
   */
  move(direction, time, isRolling){
    if(this.timeLocked) {
      return;
    }
    for(let i = 0; i < this.inventory.hotbarSize; i++) {
      if(keyIsDown(49 + i)){
        this.holdingIndex = i;
        this.updateHolding();
      }
    }
    this.movementDirection = [0, 0];
    let [i, j] = direction;
    this.speed = isRolling && (j !== 0 || i !== 0) ?
      this.rollSpeed : this.defaultSpeed;
    this.speed += this.speedBonus;
    
    //animation
    this.animationNum[1] = (i === -1)*1;
    this.animationNum[0] = i === 0 && j === 0 ?
      7: isRolling? 3:i === 0 ? 5:0; 
    this.animationNum[0] += j === -1;

    //player movement
    let distance = sqrt(i*i + j*j)!== 0 ?
      time*this.speed/sqrt(i*i + j*j) : 0;
    if(this.canMoveTo(this.collisionMap[Math.floor(this.pos[1]+j*distance)]
      [Math.floor(this.pos[0])])){
      this.movementDirection[1] = j*distance;
    }
    if(this.canMoveTo(this.collisionMap[Math.floor(this.pos[1])]
      [Math.floor(this.pos[0]+i*distance)])){
      this.movementDirection[0] = i*distance;
    }
    this.pos[0] += this.movementDirection[0];
    this.pos[1] += this.movementDirection[1];
    this.activeZone = this.collisionMap[Math.floor(this.pos[1])]
      [Math.floor(this.pos[0])];
  }

  /**
   * Attempts an attack with the currently held item.
   */
  attack(dungeon, time, isRolling) {
    if(this.timeLocked) {
      return;
    }
    let enemies = [];
    if(this.locked) {
      enemies = dungeon.dungeon[this.lockedZone - 3].enemies;
    }
    let targetVector = [mouseX - width/2, mouseY - height/2];
    if(this.holding !== null) {
      this.holding.attack(enemies, targetVector, time, isRolling);
    }
  }

  /**
   * Displays the player.
   */
  display(screenCenter, screenSize) {
    if(this.timeLocked) {
      this.animationNum[0] = 7;
    }
    // Also used for some player updates
    if(millis() > this.blindnessTimer) {
      this.vision = Math.max(this.floorVision * this.visionPortion, 1);
    }
    else {
      this.vision = 1 * this.visionPortion;
    }
    if(this.holding !== null) {
      this.holding.display(screenCenter, screenSize);
    }
    super.display(screenCenter, screenSize);
  }
}

// Possible enemy movement directions
const DIAGNORM = 0.70710678118;

const ENEMY_MOVEMENT_OPTIONS = [[1,0], [DIAGNORM,DIAGNORM], [0,1],
  [-DIAGNORM,DIAGNORM], [-1,0], [-DIAGNORM,-DIAGNORM], [0,-1], 
  [DIAGNORM,-DIAGNORM]];

/**
 * Generally useful auxillary function: dot product
 */
function dotProduct(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Generally useful auxillary function: setting a vector's magnitude
 */
function scaleVector(a, mag = 1, b = [0,0]) {
  let d = dist(b[0], b[1], a[0], a[1]);
  if(d === 0) {
    return [0, 0];
  }
  return [mag * (a[0] - b[0]) / d, mag * (a[1] - b[1]) / d];
}

/**
 * Weights class for determining an enemy's movement direction.
 */
class Weights {
  constructor() {
    this.resolution = 8; // May be tweaked later
    this.weights = Array(this.resolution).fill(0);
  }

  /**
   * Vector weighing.
   * @param {Array<number>} vec The vector to weigh.
   * @param {function} shaper Mapper from dot product to weight.
   */
  weighVector(vec, shaper = (x) => x) {
    let w;
    for(let i = 0; i < this.resolution; i++) {
      w = dotProduct(vec, ENEMY_MOVEMENT_OPTIONS[i]);
      this.weights[i] += shaper(w);
      // console.log(w);
    }
  }

  /**
   * Runs towards the player.
   */
  weighPursuitVector(pursuitVector, scaling = 1) {
    this.weighVector(scaleVector(pursuitVector), (x) => scaling * x);
  }

  /**
   * Strafes around the player.
   */
  weighStrafe(pursuitVector, scaling = 1) {
    this.weighVector(scaleVector(pursuitVector), (x) =>
      scaling * (1 - Math.abs(x)));
  }

  /**
   * Avoids obstacles.
   */
  weighObstacles(collisionMap, freeZones, pos, radius = 2, expScaling = 3) {
    for(let i = -radius; i <= radius; i++) {
      for(let j = -radius; j <= radius; j++) {
        let blockX = Math.floor(pos[0]) + j;
        let blockY = Math.floor(pos[1]) + i;
        if(verifyIndices(collisionMap, blockY, blockX)
          && collisionMap[blockY][blockX] !== freeZones) {
          // Centre at the centre of the square
          blockX += 0.5;
          blockY += 0.5;
          let d = dist(blockX, blockY, pos[0], pos[1]);
          this.weighVector(scaleVector([blockX - pos[0], blockY - pos[1]],
            1/d**expScaling), (x) => -x);
        }
      }
    }
  }

  /**
   * General balanced combat approach
   */
  weighBalancedApproach(pursuitVector, pursuitMidpoint, retreatMidpoint = 0,
    strafeMultiplier = 1, steepness = 0.7) {
    // Finds the pursuit logistic curve
    let pursuitPortion = 1 / (1 + Math.exp(-steepness * (dist(pursuitVector[0],
      pursuitVector[1], 0, 0) - pursuitMidpoint)));

    // Finds the retreat logistic curve
    let retreatPortion = 1 - 1 / (1 + Math.exp(
      -steepness * (dist(pursuitVector[0],
      pursuitVector[1], 0, 0) - retreatMidpoint)));

    this.weighPursuitVector(pursuitVector, pursuitPortion);
    this.weighPursuitVector(pursuitVector, -retreatPortion);
    this.weighStrafe(pursuitVector,
      strafeMultiplier * (1-pursuitPortion - retreatPortion));
  }

  /**
   * Weighs the direction of the player.
   */
  weighTargetDirection(player, scaling) {
    this.weighVector(scaleVector(player.movementDirection, scaling));
  }

  /**
   * Avoid oscillations.
   */
  weighMomentum(prevDirection) {
    this.weighVector(scaleVector(prevDirection, 1));
  }

  /**
   * Avoid others.
   */
  weighSocialDistancing(pos, others, distFactor = 1) {
    for(let other of others) {
      let directionVector = [other.pos[0] - pos[0], other.pos[1] - pos[1]];
      let distance = dist(directionVector[0], directionVector[1], 0, 0);
      if(distance === 0) {
        continue;
      }
      this.weighVector(scaleVector(directionVector, 1), (x) =>
        distFactor * (1 - 2 * Math.abs(x+0.7))/Math.pow(distance, 3));
    }
  }

  /**
   * Return the results of the weights.
   */
  getMaxDir() {
    return ENEMY_MOVEMENT_OPTIONS[this.weights.indexOf(
      Math.max(...this.weights))];
  }
}

/**
 * Converts screen coordinates to dungeon map coordinates.
 */
function sceneToDungeonPos(pos, screenCenter, screenSize) {
  let posScaleX = width/screenSize[0];
  let posScaleY = height/screenSize[1];
  let [x, y] = [pos[0] / posScaleX, pos[1] / posScaleY];
  x += screenCenter[0] - screenSize[0]*0.5;
  y += screenCenter[1] - screenSize[1]*0.5;
  return [x, y];
}

/**
 * Converts dungeon map coordinates to screen coordinates.
 */
function dungeonToScreenPos(pos, screenCenter, screenSize) {
  let [x, y] = [pos[0] - screenCenter[0], pos[1] - screenCenter[1]];
  let posScaleX = width/screenSize[0];
  let posScaleY = height/screenSize[1];
  x += screenSize[0]*0.5;
  y += screenSize[1]*0.5;
  x *= posScaleX;
  y *= posScaleY;
  return [x, y];
}
