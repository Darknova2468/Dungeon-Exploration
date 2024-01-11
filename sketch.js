/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let anotherDungeon;
let minimap;
let player;
let tileSet;
let myBackground;
// let playerTileSet;
// let slimeTileSet;
// let fireSlimeTileSet;
// let fireBallTileSet;
// let iceSlimeTileSet;
// let zombieTileSet;
// let boneTileSet;
// let phantomTileSet;
// let phantomBallTileSet;

function preload() {
  // tileSet = new TileSet("textures/CaveTiles.png", [16, 16]);
  // playerTileSet = new AnimateSet("textures/player.png", [19, 21]);
  // slimeTileSet = new AnimateSet("textures/slime.png", [19, 21]);
  // fireSlimeTileSet = new AnimateSet("textures/fireSlime.png", [19, 21]);
  // fireBallTileSet = new AnimateSet("textures/fireBall.png", [12, 14]);
  // iceSlimeTileSet = new AnimateSet("textures/iceSlime.png", [19, 21]);
  // zombieTileSet = new AnimateSet("textures/zombie.png", [19, 21]);
  // boneTileSet = new AnimateSet("textures/bone.png", [15, 15]);
  // phantomTileSet = new AnimateSet("textures/phantom.png", [18, 18]);
  // phantomBallTileSet = new AnimateSet("textures/phantomBall.png", [16, 16]);
  textures = {
    tileSet: new TileSet("textures/CaveTiles.png", [16, 16]),
    playerTileSet: new AnimateSet("textures/player.png", [19, 21]),
    slimeTileSet: new AnimateSet("textures/slime.png", [19, 21]),
    lavaSlimeTileSet: new AnimateSet("textures/lavaSlime.png", [19, 21]),
    lavaSlimeBallTileSet: new AnimateSet("textures/lavaSlimeBall.png", [12, 14]),
    frostSlimeTileSet: new AnimateSet("textures/frostSlime.png", [19, 21]),
    slimeTentacleTileSet: "dodgerblue",
    slimeBossTileSet: "dodgerblue",
    slimeTentacleStunnedTileSet: "lightskyblue",
    zombieTileSet: new AnimateSet("textures/zombie.png", [19, 21]),
    boneTileSet: new AnimateSet("textures/bone.png", [15, 15]),
    phantomTileSet: new AnimateSet("textures/phantom.png", [18, 18]),
    darkSpellTileSet: new AnimateSet("textures/darkSpell.png", [16, 16]),
    goblinTileSet: new AnimateSet("textures/goblin.png", [18, 18]),
    hobgoblinTileSet: "chocolate",
    skeletonTileSet: new AnimateSet("textures/skeleton.png", [18, 18]),
    frozenPuddleTileSet: "powderblue",
    arrowTileSet: "white",
    inactivePortalTileSet: "dimgrey",
    activePortalTileSet: "purple",
  };
}

function setup() {
  createCanvas(1000, 500);
  textAlign(CENTER);
  fill(255);
  frameRate(30);
  noStroke();
  noSmooth();
  myDungeon = createDungeonMap(5);
  player = new Player(structuredClone(myDungeon.playerPos), myDungeon.minimap);
  enterDungeonMap(myDungeon);
}

let gameActive = true;
let deathTimer = 0;
const deathTime = 2000;
let thisDeathMessage;

function draw() {
  if(!gameActive) {
    background(100, 0, 0, 10);
    fill("white");
    textAlign(CENTER, CENTER);
    text(thisDeathMessage, width/2, height/2);
    if(millis() - deathTimer > deathTime) {
      enterDungeonMap(myDungeon);
      player.health = 10;
      let room = myDungeon.dungeon[player.activeZone];
      room.entranceStage = 0;
      room.locked = false;
      player.activeZone = -1;
      player.lockedZone = 0;
      player.timeLocked = false;
      player.locked = false;
      player.isAlive = true;
      gameActive = true;
    }
    return;
  }
  else if(!player.isAlive) {
    background(100, 0, 0, 100);
    fill("white");
    textAlign(CENTER, CENTER);
    thisDeathMessage = deathMessages[0];
    thisDeathMessage = random(deathMessages);
    text(thisDeathMessage, width/2, height/2);
    deathTimer = millis();
    gameActive = false;
    return;
  }
  background(0);
  let dt = 1 / frameRate();
  if(dt > 0.2) {
    dt = 0.2;
  }
  player.move([keyIsDown(68)-keyIsDown(65) ,keyIsDown(83)-keyIsDown(87)], dt, keyIsDown(16));
  player.attack(myDungeon, dt, keyIsDown(16));
  myDungeon.update(player, dt);
  image(myBackground.generateScene(player.pos, dt), width/2, height/2, width, height);
  player.display(player.pos, myBackground.scale, [16, 16]);
  myDungeon.display(player.pos, myBackground.scale, [16, 16]);
  image(minimap.generateImage(player.pos), width-height*3/20, height*3/20, height/5, height/5);
  fill("white");
  textSize(12);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  textSize(20);
  text("Health: " + Math.ceil(player.health), height*3/20, height*3/20);
  text("On Floor " + myDungeon.floorNumber, height*3/20, height*2/20);
  // if(millis() > 1000 && player.isAlive) {
  //   player.isAlive = false;
  // }
}