/* eslint-disable no-undef */

/**
 * This file primarily concerns dungeon maps, which are at the heart of Dungeon
 *   Exploration gameplay. Dungeon maps are the settings in which the dungeons
 *   take place, which each floor corresponding to one dungeon map. These also
 *   control most of the environment, such as enemies, ambience, and other
 *   entities like coins, NPCs, and portals.
 */

const PERSISTENTDUNGEONS = false;
const allDungeons = new Map(); // May store floor data
let floorBitmask; // Stores the available floors as a bitmask
const GENERATIONDEBUG = false;

/**
 * Creates a dungeon map.
 * @param {number} floor The floor number.
 * @returns The dungeon map.
 */
function createDungeonMap(floor) {
  if(PERSISTENTDUNGEONS && allDungeons.has(floor)) {
    return allDungeons.get(floor);
  }
  let dungeonMap = new DungeonMap(floor);
  while(dungeonMap.corrupted) {
    if(GENERATIONDEBUG) {
      console.log("Regenerating...");
    }
    dungeonMap = new DungeonMap(floor);
  }
  if(GENERATIONDEBUG) {
    console.log("Finished generation.");
  }
  allDungeons.set(floor, dungeonMap);
  return dungeonMap;
}

/**
 * Enters a dungeon map.
 * @param {DungeonMap} dungeonMap The dungeon map.
 */
function enterDungeonMap(dungeonMap) {
  // Creates a new minimap
  minimap = new Maps(30, dungeonMap.minimap, [width-height*3/20, height*3/20],
    [height/5, height/5]);
  
  // Resets various things
  player.health = structuredClone(player.maxHealth);
  player.pos = structuredClone(dungeonMap.playerPos);
  player.collisionMap = dungeonMap.minimap;
  player.visionPortion = 1;
  myBackground = new Scene(dungeonMap.minimap, [16, 8], textures.tileSet);
  player.updateVision(dungeonMap);
}

/**
 * Re-enters a dungeon map after dying to it.
 * @param {DungeonMap} dungeonMap The dungeon map.
 */
function reEnterDungeonMap(dungeonMap){
  player.pos = structuredClone(dungeonMap.playerPos);
  player.collisionMap = dungeonMap.minimap;
  player.visionPortion = 1;
  myBackground = new Scene(dungeonMap.minimap, [16, 8], textures.tileSet);
}

/**
 * Restores the player to default status.
 * @param {Player} player The player.
 */
function restorePlayer(player) {
  player.health = player.maxHealth;
  player.activeZone = -1;
  player.lockedZone = 0;
  player.timeLocked = false;
  player.locked = false;
  player.isAlive = true;
}

/**
 * The dungeon map.
 */
class DungeonMap {
  constructor(_floor){
    this.enemies = [];
    this.otherEntities = [];
    this.floorNumber = _floor;
    if(this.floorNumber === 0) {
      this.constructGuildHall();
      return;
    }
    else if(this.floorNumber === 21) {
      this.constructEndOfTime();
      return;
    }

    // Read data from floors.js
    this.floor = floors[this.floorNumber]; // Floor-specific data
    this.numberOfRooms = this.floor[0]; // The number of rooms
    this.enemyDifficulties = this.floor[1]; // The enemy difficulty ranges
    this.twoPathChance = this.floor[2]; // Probability of two forward paths
    this.caveEdgeChance = this.floor[3]; // Probability of cave edge
    this.denseCaveEdgeChance = this.floor[4]; // Conditional probability of a
    // second cave edge given that the first one is a cave edge

    // Sets ambience
    this.ambience = color(0, 0, 50, Math.min(255, this.floorNumber * 20));

    // Determines difficulties of starting and boss rooms
    this.difficulties = [[], [0,0,0,0]];
    this.enemyDifficulties.forEach((bounds) => {
      this.difficulties[0].push(bounds[1]);
    });

    // Adds difficulties of other rooms
    for(let i = 1; i < this.numberOfRooms - 1; i++) {
      this.difficulties.unshift([]);
      this.enemyDifficulties.forEach((bounds) => {
        this.difficulties[0].push(Math.floor(random(bounds[0], bounds[1])));
      });
    }

    // Sorts difficulties to fix everything
    this.difficulties.sort((a, b) => getArraySum(a)-getArraySum(b));

    // Builds room nodes
    this.dungeon = [new Room(0, 6, this, this.difficulties[0],
      this.caveEdgeChance, this.denseCaveEdgeChance)];
    for(let i=1; i<this.numberOfRooms-1; i++){
      this.dungeon.push(new Room(i, floor(random(7, 9)), this,
        this.difficulties[i], this.caveEdgeChance, this.denseCaveEdgeChance));
    }
    this.dungeon.push(new Room(this.numberOfRooms - 1, 10, this,
      this.difficulties[this.numberOfRooms - 1], this.caveEdgeChance,
      this.denseCaveEdgeChance, true));

    // Adds procedural distances
    for(let i=1; i<this.numberOfRooms; i++){
      this.dungeon[i-1].addConnection(
        1+(random() < this.twoPathChance || i+2 > this.numberOfRooms), i,
        this.numberOfRooms, this.dungeon, i === this.numberOfRooms-1);
    }

    // Defines starting triangle
    let dist1 = this.dungeon[0].connections[0][1];
    let dist2 = this.dungeon[0].connections[1][1];
    let dist3 = this.dungeon[1].connections[0][1];
    
    let theta = 0.5*cosineLaw(dist1, dist2, dist3);
    this.dungeon[1].pos = [Math.abs(cos(theta)*dist1), sin(theta)*dist1];
    this.dungeon[2].pos = [Math.abs(cos(theta)*dist2), -sin(theta)*dist2];

    // Generates the rest of the tree
    for(let i=3; i<this.dungeon.length; i++){
      dist1 = this.dungeon[i-2].connections[1][1];
      dist2 = this.dungeon[i-1].connections[0][1];
      dist3 = this.dungeon[i-2].connections[0][1];
      let point1 = this.dungeon[i-2].pos;
      let point2 = this.dungeon[i-1].pos;
      let alpha = atan((point2[1] - point1[1])/(point2[0] - point1[0]));
      if(point2[0] - point1[0] < 0) {
        alpha += Math.PI;
        alpha %= 2*Math.PI;
      }
      let beta = cosineLaw(dist1, dist3, dist2);
      let theta = alpha - beta * Math.pow(-1, i);
      let point = [point1[0] + dist1 * cos(theta),
        point1[1] + dist1 * sin(theta)];
      this.dungeon[i].pos = point;
    }

    // Finds bounding box of the map
    let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
    this.dungeon.forEach(room => {
      minX = min(minX, room.pos[0]-room.radius);
      maxX = max(maxX, room.pos[0]+room.radius);
      minY = min(minY, room.pos[1]-room.radius);
      maxY = max(maxY, room.pos[1]+room.radius);
    });
    
    // Adjust the position
    this.offset = [-minX+1, -minY+1];
    this.dungeon.forEach(room => {
      room.pos = [Math.floor(room.pos[0] + this.offset[0]),
        Math.floor(room.pos[1] + this.offset[1])];
    });

    // Creates the actual dungeon map and sets player pos
    this.minimap = generateEmptyGrid(Math.floor(maxX-minX)+2,
      Math.floor(maxY-minY)+2);
    this.playerPos = this.offset;
    
    // Generate edges
    this.dungeon.forEach(room => {
      let pos1 = room.pos;
      room.connections.forEach(connection => {
        if(connection[2] === 1) {
          let pos2 = this.dungeon[connection[0]].pos;
          // console.log(pos1[0], pos2[0]);
          generateCaveEdge(this.minimap, pos1[1], pos1[0],
            pos2[1], pos2[0]);
        }
      });
    });
    
    // Generate cave nodes
    this.dungeon.forEach(room => {
      let raster = generatePrecursorDungeonRoom(room.radius, room.id + 3);
      this.minimap = integrateRaster(this.minimap, raster,
        room.pos, this.offset);
    });

    // Generate labyrinths
    this.corrupted = !generateLabyrinthEdges(this);
  }

  /**
   * Constructs and populates floor 0, the guild hall.
   */
  constructGuildHall() {
    this.width = 15;
    this.height = 12;
    this.wallDepth = 4;
    this.dungeon = [];
    this.ambience = color(0, 0, 0, 0);
    this.playerPos = [this.width / 2, this.height / 2];
    this.minimap = generateEmptyGrid(this.width, this.height);
    // Main hall
    for(let i = this.wallDepth; i < this.height - this.wallDepth; i++) {
      for(let j = 1; j < this.width - 1; j++) {
        this.minimap[i][j] = 1;
      }
    }
    let portal = new Portal([this.width - 3, this.height / 2], 1.5,
      this.floorNumber, this.minimap, textures.portalTileSet);
    portal.activate();
    this.otherEntities.push(portal);

    // Blacksmith
    for(let i = 1; i < this.wallDepth; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }
    this.otherEntities.push(new Blacksmith([6, 2], this.minimap));

    // Armorer
    for(let i = this.height - this.wallDepth; i < this.height - 1; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }
    this.otherEntities.push(new Armorer([6, this.height - 2], this.minimap));

    // Explorer
    this.otherEntities.push(new Explorer([2, this.height / 2], this.minimap));
  }

  /**
   * Enter the portal on floor 20 to find out what this means...
   */
  constructEndOfTime() {
    this.width = 150;
    this.height = 100;
    this.ambience = color(0, 0, 0, 255);
    this.playerPos = [12, this.height / 2];
    this.minimap = generateEmptyGrid(this.width, this.height);
    player.visionPortion = 0.5;

    // Replicate guild hall
    for(let i = 48; i < 52; i++) {
      for(let j = 1; j < 14; j++) {
        this.minimap[i][j] = 1;
      }
    }
    for(let i = 45; i < 48; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }
    for(let i = 52; i < 55; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }

    // Replicate inactive portal
    this.portal = new Portal([12, 50], 1.5, this.floorNumber, this.minimap,
      textures.portalTileSet);
    this.otherEntities.push(this.portal);

    // Create a tunnel
    for(let i = 54; i < 62; i++) {
      this.minimap[i][4] = 2;
    }
    for(let j = 4; j < 75; j++) {
      this.minimap[62][j] = 2;
    }

    // Create the actual boss room
    this.bossRoom = new Room(0, 20, this, [0,0,0,0], 0, 0, true);
    this.bossRoom.portal = this.portal;
    this.dungeon = [this.bossRoom];
    this.bossRoom.pos = [60, 50];
    let raster = generatePrecursorDungeonRoom(this.bossRoom.radius,
      this.bossRoom.id + 3);
    this.minimap = integrateRaster(this.minimap, raster, this.bossRoom.pos,
      this.offset);
  }

  /**
   * Updates the dungeon map.
   * @param {Player} player The player.
   * @param {number} time The time since last update.
   */
  update(player, time){
    this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    this.otherEntities = this.otherEntities.filter(entity => {
      entity.operate(player, time);
      return entity.isAlive;
    });
    this.dungeon.forEach(room => {
      room.operate(player, time);
    });
  }

  /**
   * Displays everything in the dungeon map.
   * @param {Array.<number>} screenCenter The centre of the screen in-game.
   * @param {Array.<number>} screenSize The dimensions of the screen in-game.
   * @param {*} scale Unused variable...
   */
  display(screenCenter, screenSize, scale){
    this.otherEntities.forEach(entity => {
      entity.display(screenCenter, screenSize, scale);
    });
    this.dungeon.forEach(room => {
      room.display(screenCenter, screenSize, scale);
    });
  }

  /**
   * Prepares a dungeon map for player respawn.
   * @param {number} playerActiveZone The active zone of the player.
   */
  cleanUp(playerActiveZone) {
    if(playerActiveZone >= 3) {
      let room = this.dungeon[playerActiveZone - 3];
      if(room.locked) {
        room.entranceStage = 0;
        room.locked = false;
      }
    }
  }
}

/**
 * Each dungeon room in the dungeon map, vital for generation and gameplay.
 */
class Room {
  constructor(_id, _radius, _dungeonMap, _difficulties, _caveEdgeChance,
    _denseCaveEdgeChance, _isBoss = false){
    this.dungeonMap = _dungeonMap;
    this.id = _id; // Zone id in the grid
    this.radius = _radius;
    this.connections = []; // Connections to other rooms
    this.pos = [0, 0]; // xy coordinates
    this.enemies = [];
    this.locked = true;
    this.entranceStage = 0; // State variable for room progression
    this.entranceTimer = 0;
    this.entranceTime = 700;
    this.difficulties = _difficulties; // Array: slime, goblin, undead, and
    // draconian difficulties, respectively

    // Customization variables, see dungeon map documentation
    this.caveEdgeChance = _caveEdgeChance;
    this.denseCaveEdgeChance = _denseCaveEdgeChance;
    this.isBoss = _isBoss;
    this.portal = null;
    this.healed = false;
  }

  /**
   * Randomly specifies connection outlines (e.g. type of connection, distance)
   */
  addConnection(numberOfConnections, index, numberOfRooms, dungeon, check){
    // Pushes connections to node
    let distance = random() < this.caveEdgeChance ? 3:Math.floor(random(8, 12));
    if(check){
      this.connections.push([index, dungeon[index].radius+this.radius+distance,
        1+(distance>3)]);
    }
    else {
      if(numberOfConnections === 1){      
        if(random() < 0.5 && index+1 < numberOfRooms){
          this.connections.push([index,
            dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
          this.connections.push([index+1,
            dungeon[index+1].radius+this.radius+3, 0]);
        }
        else {
          this.connections.push([index,
            dungeon[index].radius+this.radius+3, 0]);
          this.connections.push([index+1,
            dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
        }
      }
      else {
        this.connections.push([index,
          dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
        distance = random() < this.denseCaveEdgeChance ? 3:Math.floor(random(8, 12));
        this.connections.push([index+1,
          dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
      }
    }
  }

  /**
   * Operates a room. This includes major aspects such as controlling
   *   entranceStage for room progression.
   */
  operate(player, time) {
    if(player.activeZone !== this.id + 3) {
      return;
    }
    if(!this.entranceStage) {
      if(this.id >= 1 || this.dungeonMap.floorNumber === 21) {
        // Lock the room and initiate zooming
        this.locked = true;
        player.locked = true;
        player.timeLocked = true;
        player.lockedZone = this.id + 3;
        myBackground.changeDimensions([this.radius * 4, this.radius * 2],
          this.pos, 700, false);
        this.entranceStage = 1;
        if(this.dungeonMap.floorNumber === 21) {
          menuManager.menus.push(new DragonDialogue());
        }
      }
    }
    if(myBackground.transitioning || !this.locked) {
      return;
    }
    else if(this.entranceStage === 1) {
      // Zoom again, if it wasn't obvious enough the first time
      this.entranceStage = 2;
      myBackground.changeDimensions([this.radius * 4, this.radius * 2],
        this.pos, 700, false);
    }
    else if(this.entranceStage === 2) {
      // Summon the enemies and hide everything else
      this.entranceStage = 3;
      this.spawnEnemies();
      this.spawnPortal();
      this.enemies.forEach(enemy => {
        enemy.invincible = true;
      });
      myBackground.displayOnly = this.id+3;
      myBackground.changeDimensions([this.radius * 4, this.radius * 2],
        this.pos, 1500, true);
      if(this.dungeonMap.floorNumber === 21) {
        this.dungeonMap.ambience = color(0, 0, 100, 150);
      }
    }
    else if(this.entranceStage === 3) {
      // Zoom back to an acceptable scale for combat
      this.entranceStage = 4;
      if(this.dungeonMap.floorNumber === 21) {
        myBackground.changeDimensions([32, 16], player.pos, 500, false);
      }
      else {
        myBackground.changeDimensions([16, 8], player.pos, 500, false);
      }
    }
    else if(this.entranceStage === 4) {
      // Ends timelock and starts the fight!
      this.entranceStage = 5;
      this.enemies.forEach(enemy => {
        enemy.invincible = false;
      });
      player.timeLocked = false;
    }
    else {
      // Normal combat operations
      this.enemies = this.enemies.filter(enemy => enemy.isAlive);
      this.enemies.forEach(enemy => {
        enemy.operate(player, this.enemies, time);
      });
      if(this.enemies.length === 0) {
        // End the fight
        this.locked = false;
        player.locked = false;
        this.activatePortal();
        myBackground.displayOnly = null;
        myBackground.changeDimensions([12, 6], player.pos, 1000, true);
        if(this.isBoss) {
          // Mark next room as available
          floorBitmask |= 1 << this.dungeonMap.floorNumber;
          storeItem("floorBitmask", floorBitmask);
        }
      }

      // If all enemies are passive (e.g. frozen puddles), despawn them
      for(let enemy of this.enemies) {
        if(!enemy.passive) {
          return;
        }
      }
      for(let enemy of this.enemies) {
        enemy.isAlive = false;
      }

      if(!this.healed){
        player.health += 0.5*(player.maxHealth - player.health);
        this.healed = true;
      } 
    }
  }

  display(screenCenter, screenSize, scale){
    if(this.entranceStage < 3) {
      return;
    }
    this.enemies.forEach(enemy => {
      enemy.display(screenCenter, screenSize, scale);
    });
  }

  attemptEnemyPlacement(EnemyType, level = 1, radiusPortion = 1) {
    if(ENEMYDEBUG) {
      console.log(EnemyType);
    }
    let enemy = new EnemyType([this.pos[0]+ random(
      -this.radius * radiusPortion / 2, this.radius * radiusPortion / 2),
    this.pos[1] + random(-this.radius * radiusPortion / 2,
      this.radius * radiusPortion / 2)], this.id, level,
    this.dungeonMap.minimap);
    if(enemy.canMoveTo(this.dungeonMap.minimap[
      Math.floor(enemy.pos[1])][Math.floor(enemy.pos[0])])) {
      return enemy;
    }
    if(ENEMYDEBUG) {
      console.log("Failed placement, retrying...");
    }
    return this.attemptEnemyPlacement(EnemyType);
  }

  /**
   * Used during testing phase to spawn certain enemies in each room.
   */
  testSpawnEnemies() {
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Slime));
    // }
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(LavaSlime));
    // }
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(FrostSlime));
    // }
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Zombie));
    // }
    // for(let i = 0; i < 1; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Booyahg));
    // }
    // for(let i = 0; i < 1; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Hobgoblin));
    // }
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Skeleton));
    // }
    // for(let i = 0; i < 0; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(Phantom));
    // }
    // for(let i = 0; i < 1; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(RedDraconian));
    // }
    // for(let i = 0; i < 1; i++) {
    //   this.enemies.push(this.attemptEnemyPlacement(BlueDraconian));
    // }
    for(let i = 0; i < 1; i++) {
      this.enemies.push(this.attemptEnemyPlacement(BlackDraconian));
    }
    // this.summonSlimeBoss();
  }

  /**
   * Summons the enemies.
   */
  spawnEnemies() {
    this.enemies = [];
    // Check if the fight is a boss one
    if(!this.summonSlimeBoss() && !this.summonWarlord()
      && !this.summonNecromancerKing() && !this.summonDragon()) {
      // Summons each enemy
      let slimes = createSlimes(this.difficulties[0]);
      let goblins = createGoblins(this.difficulties[1]);
      let undeads = createUndead(this.difficulties[2]);
      let draconians = createDraconians(this.difficulties[3]);
      for(let [slimeClass, level, radiusPortion] of slimes) {
        this.enemies.push(this.attemptEnemyPlacement(slimeClass, level,
          radiusPortion));
      }
      for(let [goblinClass, level, radiusPortion] of goblins) {
        this.enemies.push(this.attemptEnemyPlacement(goblinClass, level,
          radiusPortion));
      }
      for(let [undeadClass, level, radiusPortion] of undeads) {
        this.enemies.push(this.attemptEnemyPlacement(undeadClass, level,
          radiusPortion));
      }
      for(let [draconianClass, level, radiusPortion] of draconians) {
        this.enemies.push(this.attemptEnemyPlacement(draconianClass, level,
          radiusPortion));
      }
    }
  }

  /**
   * Summons a portal.
   */
  spawnPortal() {
    if(!this.isBoss || this.dungeonMap.floorNumber === 21) {
      return;
    }
    this.portal = new Portal(this.pos, 1.5, this.dungeonMap.floorNumber,
      this.dungeonMap.minimap, textures.portalTileSet);
    this.dungeonMap.otherEntities.push(this.portal);
  }

  /**
   * Activates the portal if done.
   */
  activatePortal() {
    if(!this.isBoss) {
      return;
    }
    this.portal.activate();
  }

  // The next few commands all check if a major boss must be spawned

  summonSlimeBoss() {
    if(!this.isBoss || this.dungeonMap.floorNumber !== 5) {
      return false;
    }
    this.enemies.push(new SlimeBoss(structuredClone(this.pos), this.id,
      this.dungeonMap.minimap, this.enemies));
    return true;
  }

  summonWarlord() {
    if(!this.isBoss || this.dungeonMap.floorNumber !== 10) {
      return false;
    }
    this.enemies.push(new Warlord(structuredClone(this.pos), this.id,
      this.dungeonMap.minimap));
    return true;
  }

  summonNecromancerKing() {
    if(!this.isBoss || this.dungeonMap.floorNumber !== 15) {
      return false;
    }
    this.enemies.push(new NecromancerKing(structuredClone(this.pos), this.id,
      this.dungeonMap.minimap));
    return true;
  }

  summonDragon() {
    if(!this.isBoss || this.dungeonMap.floorNumber !== 21) {
      return false;
    }
    for(let i = 0; i < 5; i++) {
      this.enemies.push(this.attemptEnemyPlacement(RedDraconian, 500, 0.5));
    }
    for(let i = 0; i < 5; i++) {
      this.enemies.push(this.attemptEnemyPlacement(BlueDraconian, 500, 0.2));
    }
    for(let i = 0; i < 5; i++) {
      this.enemies.push(this.attemptEnemyPlacement(BlackDraconian, 500, 1));
    }
    return true;
  }
}

//using two points creates all parameters of a line
class Line {
  constructor(_point1, _point2){
    this.point1 = _point1;
    this.point2 = _point2;
    this.slope = (_point2[1]-_point1[1])/(_point2[0]-_point1[0]);
    this.yint = _point1[1]-this.slope*_point1[0];
  }
}

//integrates a raster of 1s and 0s into a larger array
function integrateRaster(minimap, raster, pos){
  let pos1 = [Math.floor(pos[0]-(raster.length+1)/2),
    Math.floor(pos[1]-(raster[0].length+1)/2)];
  for(let y=0; y<raster.length; y++){
    for(let x=0; x<raster[y].length; x++){
      if(raster[y][x]) {
        minimap[y+pos1[1]][x+pos1[0]] = raster[y][x];
      }
    }
  }
  // minimap[pos[1]][pos[0]] = cellTypes.exit;
  return minimap;
}

/**
 * Finds an angle in a triangle given three side lengths.
 * @param {number} leg1 The first leg.
 * @param {number} leg2 The second leg.
 * @param {number} opp The opposite angle.
 * @returns The angle of the angle in radians.
 */
function cosineLaw(leg1, leg2, opp){
  if(DEBUG) {
    console.assert(leg1 + leg2 > opp,
      "[Cosine Law] Opposite side length is too short!");
    console.assert(opp + leg2 > leg1,
      "[Cosine Law] Leg 1 side length is too short!");
    console.assert(opp + leg1 > leg2,
      "[Cosine Law] Leg 2 side length is too short!");
  }
  return acos((leg1*leg1+leg2*leg2-opp*opp)/(2*leg1*leg2));
}

//checks if a number is with in a bound
function between(point, bound1, bound2){
  let minimum = min(bound1, bound2);
  let maximum = max(bound1, bound2);
  return minimum <= point && maximum >= point;
}

//generates a single organic shaped room
function generatePrecursorDungeonRoom(radius, toFill) {
  let room = generateEmptyGrid(2*radius - 1, 2*radius - 1);
  room = generateCaveNode(room, radius, radius, radius - 4, radius, toFill);
  return room;
}

/**
 * Converts an empty array to a uniform 2d array.
 * @param {Array} grid The grid to fill.
 * @param {number} x The number of cells per row.
 * @param {number} toFill The number to fill the cells with.
 */
function generateEmptyGrid(x = xSize, y = ySize, toFill = 0) {
  let emptyGrid = new Array(y);
  for(let i = 0; i < y; i++) {
    emptyGrid[i] = new Array(x).fill(toFill);
  }
  return emptyGrid;
}

/**
 * Gets the sum of an array.
 */
function getArraySum(arr) {
  acc = 0;
  arr.forEach((x) => {
    acc += x;
  });
  return acc;
}