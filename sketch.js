/* eslint-disable no-undef */
// Project Title
// Your Name
// Date
//
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let myDungeon;
let minimap;
let player;
let tileSet;
let myBackground;
let playerTileSet;
let slimeTileSet;
let fireSlimeTileSet;
let zombieTileSet;
let boneTileSet;

function preload() {
  tileSet = new TileSet("textures/CaveTiles.png", [16, 16]);
  playerTileSet = new AnimateSet("textures/player.png", [19, 21]);
  slimeTileSet = new AnimateSet("textures/slime.png", [19, 21]);
  fireSlimeTileSet = new AnimateSet("textures/fireSlime.png", [19, 21]);
  zombieTileSet = new AnimateSet("textures/zombie.png", [19, 21]);
  boneTileSet = new AnimateSet("textures/bone.png", [15, 15]);
}

function setup() {
  createCanvas(600, 300);
  textAlign(CENTER);
  fill(255);
  frameRate(30);
  noStroke();
  noSmooth();
  myDungeon = new DungeonMap(5, 0.3, [slimeTileSet, fireSlimeTileSet, zombieTileSet, boneTileSet]);
  minimap = new MiniMap(30, myDungeon.minimap);
  player = new Player(myDungeon.playerPos, myDungeon.minimap, playerTileSet);
  myBackground = new Scene(myDungeon.minimap, [16, 8], tileSet);
}

let gameActive = true;
let deathMessages = ["YOU DIED", "skill issue lol", "Try using left click next time", "I heard dodging increases your chance of survival", "You just discovered the health bar!", "Sadly, you aren't invincible.", "THE UNIVERSE HATES YOU", "It's funny watching you die yet again", "pathetic", "Here we go again", "I could've done better than you there", "I'm sending you to the timeout corner", "Try dodging next time.", "You were supposed to be the protagonist", "You're learning! too slowly though", "Have you considered moving?", "Were you trying there?", `Did something get in your eye?
I hope it's in your lungs next time`, "laughable", "go touch grass", "You know you can't play the game while you're dead", "100K5 1iK3 Y0U G0t PWN3D 7H3R3", "rip bozo", "[CENSORED]", "Are you procrastinating on something?", "hey clown do that again", "Do you need me to sell you the skill solution?", "L + Ratio...", "I'm back, what did I miss?", "You could've blamed gravity if it existed", "maggots", `Nice hustle, tons of fun,
Next time eat a salad!`, "They murdered your toys as well.", "At least you died for honor -- and my amusement!", "Imagine not having depth perception", "Oops! That was not medicine!", "You need a healer.", "Think fast, chucklenuts", "I would call you short if there was something left to measure."];
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
    thisDeathMessage = random(deathMessages);
    // thisDeathMessage = deathMessages[38];
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
  player.attack(myDungeon.enemies, dt);
  myDungeon.move(player, dt); 
  image(myBackground.generateScene(player.pos), width/2, height/2, width, height);
  player.display(player.pos, myBackground.scale, [16, 16]);
  myDungeon.display(player.pos, myBackground.scale, [16, 16]);
  image(minimap.generateImage(player.pos), width-height*3/20, height*3/20, height/5, height/5);
  fill("white");
  textSize(12);
  text("fps: " + Math.floor(frameRate()), width-height*3/20, height*6/20);
  textSize(20);
  text("Health: " + Math.ceil(player.health), height*3/20, height*3/20);  
}