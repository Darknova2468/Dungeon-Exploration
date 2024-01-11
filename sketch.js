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
let myBackground;
let healthBar;

function preload() {
  textures = {
    tileSet: new TileSet("textures/CaveTiles.png", [16, 16]),
    healthBarTileSet: new TileSet("textures/Hearts.png", [21, 18]),
    playerTileSet: new AnimateSet("textures/player.png", [19, 21]),
    slimeTileSet: new AnimateSet("textures/slime.png", [19, 21]),
    lavaSlimeTileSet: new AnimateSet("textures/lavaSlime.png", [19, 21]),
    lavaSlimeBallTileSet: new AnimateSet("textures/lavaSlimeBall.png", [12, 14]),
    frostSlimeTileSet: new AnimateSet("textures/frostSlime.png", [19, 21]),
    slimeTentacleTileSet: "dodgerblue",
    slimeBossTileSet: new AnimateSet("textures/slimeBoss.png", [31, 21]),
    slimeTentacleStunnedTileSet: "lightskyblue",
    zombieTileSet: new AnimateSet("textures/zombie.png", [19, 21]),
    boneTileSet: new AnimateSet("textures/bone.png", [15, 15]),
    phantomTileSet: new AnimateSet("textures/phantom.png", [18, 18]),
    darkSpellTileSet: new AnimateSet("textures/darkSpell.png", [16, 16]),
    goblinTileSet: new AnimateSet("textures/goblin.png", [18, 18]),
    hobgoblinTileSet: "chocolate",
    skeletonTileSet: new AnimateSet("textures/skeleton.png", [18, 18]),
    frozenPuddleTileSet: "powderblue",
    daggerTileSet: new AnimateSet("textures/dagger.png", [9, 47]),
    swordTileSet: new AnimateSet("textures/sword.png", [11, 72]),
    spearTileSet: new AnimateSet("textures/spear.png", [7, 72]), 
    axeTileSet: new AnimateSet("textures/axe.png", [17, 64]),
    shortBowTileSet: new AnimateSet("textures/crossBow.png", [17, 40]),
    longBowTileSet: new AnimateSet("textures/bow.png", [23, 40]),
    arrowTileSet: new AnimateSet("textures/arrow.png", [15, 15]),
    inactivePortalTileSet: "dimgrey",
    activePortalTileSet: new AnimateSet("textures/portal.png", [40, 40]),
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
  player = new Player(myDungeon.playerPos, myDungeon.minimap);
  healthBar = new HealthBar(player.health, textures.healthBarTileSet, [50, 50], 2.5);
  enterDungeonMap(myDungeon);
}

let gameActive = true;
let thisDeathMessage;

function draw() {
  if(!gameActive) {
    background(100, 0, 0, 10);
    fill("white");
    textAlign(CENTER, CENTER);
    text(thisDeathMessage, width/2, height/2);
    return;
  }
  else if(!player.isAlive) {
    background(100, 0, 0, 100);
    fill("white");
    textAlign(CENTER, CENTER);
    thisDeathMessage = deathMessages[0];
    thisDeathMessage = random(deathMessages);
    text(thisDeathMessage, width/2, height/2);
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
  myBackground.pos = structuredClone(player.pos);  
  let images = myBackground.generateScene();
  images.forEach((img, index) => {
    if(index === 1){
      tint(myBackground.fade);
    }
    image(img, width/2, height/2, width, height);
    tint(255);
  });
  myDungeon.display(myBackground.pos, myBackground.scale, [16, 16]);
  player.display(myBackground.pos, myBackground.scale, [16, 16]);
  if(keyIsDown(20)){
    minimap.displayMap(player.pos);
  } 
  minimap.displayMinimap(player.pos);
  healthBar.display(player.health);
  fill("white");
  textSize(12);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  textSize(20);
  text("On Floor " + myDungeon.floorNumber, height*3/20, height*2/10);
}

function mouseWheel(event) { 
  if(frameCount % 2 === 0){
    if(event.delta > 1 && player.holdingIndex < player.weapons.length-1){
      player.holding = player.weapons[player.holdingIndex+1];
      player.holdingIndex += 1;
    } 
    else if(event.delta < 1 && player.holdingIndex > 0){
      player.holding = player.weapons[player.holdingIndex-1];
      player.holdingIndex -= 1;
    }
  }
}