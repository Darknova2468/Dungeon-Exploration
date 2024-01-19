/* eslint-disable no-undef */

const allDungeons = new Map();
let floorBitmask = 1; // Stores the available floors as a bitmask
let persistentDungeons = true;
const GENERATIONDEBUG = false;

function createDungeonMap(floor) {
  if(persistentDungeons && allDungeons.has(floor)) {
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

function enterDungeonMap(dungeonMap) {
  minimap = new Maps(30, dungeonMap.minimap, [width-height*3/20, height*3/20], [height/5, height/5]);
  player.health = structuredClone(player.maxHealth);
  player.pos = structuredClone(dungeonMap.playerPos);
  player.collisionMap = dungeonMap.minimap;
  myBackground = new Scene(dungeonMap.minimap, [16, 8], textures.tileSet);
  player.updateVision(dungeonMap);
}

function reEnterDungeonMap(dungeonMap){
  player.pos = structuredClone(dungeonMap.playerPos);
  player.collisionMap = dungeonMap.minimap;
  myBackground = new Scene(dungeonMap.minimap, [16, 8], textures.tileSet);
}

function restorePlayer(player) {
  player.health = player.maxHealth;
  player.activeZone = -1;
  player.lockedZone = 0;
  player.timeLocked = false;
  player.locked = false;
  player.isAlive = true;
}

class DungeonMap {
  constructor(_floor){
    this.enemies = [];
    this.otherEntities = [];
    this.floorNumber = _floor;
    if(this.floorNumber === 0) {
      this.constructGuildHall();
      return;
    }
    this.floor = floors[this.floorNumber];
    this.numberOfRooms = this.floor[0];
    this.enemyDifficulties = this.floor[1];
    this.twoPathChance = this.floor[2];
    this.caveEdgeChance = this.floor[3];
    this.denseCaveEdgeChance = this.floor[4];
    this.ambience = color(0, 0, 50, Math.min(255, this.floorNumber * 20));

    // Determines difficulties of initial and boss rooms
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

    // Builds room nodes;
    this.dungeon = [new Room(0, 6, this, this.difficulties[0], this.caveEdgeChance, this.denseCaveEdgeChance)];
    for(let i=1; i<this.numberOfRooms-1; i++){
      this.dungeon.push(new Room(i, floor(random(7, 9)), this, this.difficulties[i], this.caveEdgeChance, this.denseCaveEdgeChance));
    }
    this.dungeon.push(new Room(this.numberOfRooms - 1, 10, this, this.difficulties[this.numberOfRooms - 1], this.caveEdgeChance, this.denseCaveEdgeChance, true));

    // Adds procedural distances
    for(let i=1; i<this.numberOfRooms; i++){
      this.dungeon[i-1].addConnection(1+(random() < this.twoPathChance || i+2 > this.numberOfRooms), i, this.numberOfRooms, this.dungeon, i === this.numberOfRooms-1);
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
      let point = [point1[0] + dist1 * cos(theta), point1[1] + dist1 * sin(theta)];
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
      room.pos = [Math.floor(room.pos[0] + this.offset[0]), Math.floor(room.pos[1] + this.offset[1])];
    });

    // Creates Map
    this.minimap = generateEmptyGrid(Math.floor(maxX-minX)+2, Math.floor(maxY-minY)+2);

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
      this.minimap = integrateRaster(this.minimap, raster, room.pos, this.offset);
    });

    // Generate labyrinths
    this.corrupted = !generateLabyrinthEdges(this);
  }

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
    let portal = new Portal([this.width - 3, this.height / 2], 1.5, this.floorNumber, this.minimap, textures.portalTileSet);
    portal.activate();
    this.otherEntities.push(portal);

    // Blacksmith
    for(let i = 1; i < this.wallDepth; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }
    this.otherEntities.push(new Blacksmith([6, 2], this.minimap));

    // Empty shop (add something here)
    for(let i = this.height - this.wallDepth; i < this.height - 1; i++) {
      for(let j = 4; j < 8; j++) {
        this.minimap[i][j] = 1;
      }
    }
  }

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
  display(screenCenter, screenSize, scale){
    this.otherEntities.forEach(entity => {
      entity.display(screenCenter, screenSize, scale);
    });
    this.dungeon.forEach(room => {
      room.display(screenCenter, screenSize, scale);
    });
  }

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

// class GuildHall extends DungeonMap {
//   constructor() {
//     this.otherEntities = [];
//     this.floorNumber = 0;
//   }
// }

class Room {
  constructor(_id, _radius, _dungeonMap, _difficulties, _caveEdgeChance, _denseCaveEdgeChance, _isBoss = false){
    this.dungeonMap = _dungeonMap;
    this.id = _id;
    this.radius = _radius;
    this.connections = [];
    this.pos = [0, 0];
    this.enemies = [];
    this.locked = true;
    this.entranceStage = 0;
    this.entranceTimer = 0;
    this.entranceTime = 700;
    this.difficulties = _difficulties; // [S, G, U, D]
    this.caveEdgeChance = _caveEdgeChance;
    this.denseCaveEdgeChance = _denseCaveEdgeChance;
    this.isBoss = _isBoss;
    this.portal = null;
    this.healed = false;
  }
  addConnection(numberOfConnections, index, numberOfRooms, dungeon, check){
    // Pushes connections to node
    let distance = random() < this.caveEdgeChance ? 3:Math.floor(random(8, 12));
    if(check){
      this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
    }
    else {
      if(numberOfConnections === 1){      
        if(random() < 0.5 && index+1 < numberOfRooms){
          this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+3, 0]);
        }
        else {
          this.connections.push([index, dungeon[index].radius+this.radius+3, 0]);
          this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
        }
      }
      else {
        this.connections.push([index, dungeon[index].radius+this.radius+distance, 1+(distance>3)]);
        distance = random() < this.denseCaveEdgeChance ? 3:Math.floor(random(8, 12));
        this.connections.push([index+1, dungeon[index+1].radius+this.radius+distance, 1+(distance>3)]);
      }
    }
  }

  operate(player, time) {
    if(player.activeZone !== this.id + 3) {
      return;
    }
    if(!this.entranceStage) {
      if(this.id >= 1) {
        this.locked = true;
        player.locked = true;
        player.timeLocked = true;
        player.lockedZone = this.id + 3;
        myBackground.changeDimensions([this.radius * 4, this.radius * 2], this.pos, 700, false);
        this.entranceStage = 1;
      }
    }
    if(myBackground.transitioning || !this.locked) {
      return;
    }
    else if(this.entranceStage === 1) {
      this.entranceStage = 2;
      myBackground.changeDimensions([this.radius * 4, this.radius * 2], this.pos, 700, false);
    }
    else if(this.entranceStage === 2) {
      this.entranceStage = 3;
      this.spawnEnemies();
      this.spawnPortal();
      this.enemies.forEach(enemy => {
        enemy.invincible = true;
      });
      myBackground.displayOnly = this.id+3;
      myBackground.changeDimensions([this.radius * 4, this.radius * 2], this.pos, 1500, true);
    }
    else if(this.entranceStage === 3) {
      this.entranceStage = 4;
      myBackground.changeDimensions([16, 8], player.pos, 500, false);
    }
    else if(this.entranceStage === 4) {
      this.entranceStage = 5;
      this.enemies.forEach(enemy => {
        enemy.invincible = false;
      });
      player.timeLocked = false;
    }
    else {
      this.enemies = this.enemies.filter(enemy => enemy.isAlive);
      this.enemies.forEach(enemy => {
        // console.log(player, this.enemies, time);
        enemy.operate(player, this.enemies, time);
      });
      if(this.enemies.length === 0) {
        this.locked = false;
        player.locked = false;
        this.activatePortal();
        myBackground.displayOnly = null;
        myBackground.changeDimensions([12, 6], player.pos, 1000, true);
        if(this.isBoss) {
          floorBitmask |= (1 << this.dungeonMap.floorNumber);
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
    let enemy = new EnemyType([this.pos[0]+ random(-this.radius * radiusPortion / 2, this.radius * radiusPortion / 2), this.pos[1] + random(-this.radius * radiusPortion / 2, this.radius * radiusPortion / 2)], this.id, level, this.dungeonMap.minimap);
    if(enemy.canMoveTo(this.dungeonMap.minimap[Math.floor(enemy.pos[1])][Math.floor(enemy.pos[0])])) {
      return enemy;
    }
    if(ENEMYDEBUG) {
      console.log("Failed placement, retrying...");
    }
    return this.attemptEnemyPlacement(EnemyType);
  }

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
    //   this.enemies.push(this.attemptEnemyPlacement(BlueDraconian));
    // }
    // this.summonSlimeBoss();
    // this.enemies.push(new SlimeTentacle(this.pos, this.id, this.dungeonMap.minimap));
    // this.dungeonMap.otherEntities.push(new Coin(structuredClone(this.pos), 1, this.dungeonMap.minimap));
  }

  spawnEnemies() {
    this.enemies = [];
    this.testSpawnEnemies();
    if(!this.summonSlimeBoss()) {
      let slimes = createSlimes(this.difficulties[0]);
      let goblins = createGoblins(this.difficulties[1]);
      let undeads = createUndead(this.difficulties[2]);
      for(let [slimeClass, level, radiusPortion] of slimes) {
        this.enemies.push(this.attemptEnemyPlacement(slimeClass, level, radiusPortion));
      }
      for(let [goblinClass, level, radiusPortion] of goblins) {
        this.enemies.push(this.attemptEnemyPlacement(goblinClass, level, radiusPortion));
      }
      for(let [undeadClass, level, radiusPortion] of undeads) {
        this.enemies.push(this.attemptEnemyPlacement(undeadClass, level, radiusPortion));
      }
    }
    // this.testSpawnEnemies();
    this.enemies.forEach((enemy) => {
      this.dungeonMap.enemies.push(enemy);
    });
  }

  spawnPortal() {
    if(!this.isBoss) {
      return;
    }
    this.portal = new Portal(this.pos, 1.5, this.dungeonMap.floorNumber, this.dungeonMap.minimap, textures.portalTileSet);
    this.dungeonMap.otherEntities.push(this.portal);
  }

  activatePortal() {
    if(!this.isBoss) {
      return;
    }
    this.portal.activate();
  }

  summonSlimeBoss() {
    if(!this.isBoss || this.dungeonMap.floorNumber !== 5) {
      return false;
    }
    this.enemies.push(new SlimeBoss(this.pos, this.id, this.dungeonMap.minimap, this.enemies));
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

function getArraySum(arr) {
  acc = 0;
  arr.forEach((x) => {
    acc += x;
  });
  return acc;
}