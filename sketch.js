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

function preload() {
  textures = {
    tileSet: new TileSet("textures/CaveTiles.png", [16, 16]),
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
    axeTileSet: new AnimateSet("textures/axe.png", [17, 66]),
    arrowTileSet: new AnimateSet("textures/arrow.png", [15, 15]),
    inactivePortalTileSet: "dimgrey",
    activePortalTileSet: new AnimateSet("textures/portal.png", [60, 60]),
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
  image(minimap.generateImage(player.pos), width-height*3/20, height*3/20, height/5, height/5);
  fill("white");
  textSize(12);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  textSize(20);
  text("Health: " + Math.ceil(player.health), height*3/20, height*3/20);
  text("On Floor " + myDungeon.floorNumber, height*3/20, height*2/20);
}