# Project Description

This project will be an RPG in which you explore dungeons and complete overworld tasks in the goal of reaching the 25th floor of the dungeon. You as a member of a class will be racing to the bottom for the success of your Guild.

## Needs to have:
- Proceduraly Generated Dungeons 
- 4 Different Bosses
    - With generic model
- Multiple Enemy Types with AI
    - One size fits all AI for all types of enemys
- Dynamic Lighting and Exploration
    - includes minimap that updates as you explore
    - lighting adjusts such that if you have for example a torch the screen will be brighter around you
- Materials, and Mob drop system with trade
    - When you kill an enemy it drops a "mob drop" you can trade for cash or you could harvest materials such as ore from dungeon rooms.
- Weapons and Armor upgrades
    - In the guild hall or shops you can either receive armour from task and achievements via purchase or crafting.
- Guild Hall
    - Overworld Tasks and Quests
- sfx and music
- textures
- save files

## Nice to have:
- Overworld Exploration
    - includes overworld tasks like farming
- Charectoristic AI's for different enemy types
- Multiplayer
- procedural textures using wave function collapse algorithm

## Beta ideas
None of this is coming anytime soon, please don't tell Alex about any of this

Ordered in increasing complexity:
- Natural regeneration
    - Incorporation with armour
- Sell items
- Improved lighting algorithm
    - Makes player darker as well in dim environments
- Room diversity
    - Small empty rooms
    - Puzzle rooms
        - Returning a lost item to an NPC
    - Treasure rooms, mostly at dead ends
        - Currency (coins and essence)
        - Artifacts
    - Miniboss rooms, introducing earlier draconian variants
- Save inventory (no more liquidation)
- Revamped combat mechanics
    - Prevent player from stunlocking enemies with knockback
    - Stop timers from finishing while paused
    - Dual wield
        - Double weapon
        - Shield
    - Combat skills and associated weapons
        - Deflect (sword)
        - Reckless attack (axe)
        - Skewer (spear)
        - Shove (any)
        - Dodge (dagger)
        - Burst fire (shortbow)
        - Arrow of death (longbow)
    - Vastly improved scaling system
      - Endgame weapons break the game too hard
      - Add exponential scaling
- Spells
    - New mob currency: essence (convertible with coins via. an NPC)
    - Unlock spells
    - Unique spells with interesting (but not game-breaking) effects
    - Schools of spells
        - Utility (default): speed, teleportation, time stall
        - Defensive: reflect attack, toughen, stone wall, force barrier
        - Healing: mend, healing aura, extra life, true wish
        - Offensive: ice projectile, lightning beam, fireball, solar storm
    - Each spell school has its own upgrade system
        - Power
        - Cooldown reduction
        - Focus reduction
    - Also global focus increases
- Runes
    - Add bonus effects to weapons, shields, armor, and spells
    - Large variety, e.g. triple-shot
- Better texturing?
- The dragon fight
    - Much better than before
    - The dragon itself appears with extreme health
- Hidden depths
    - Accessible after reaching a certain floor (e.g. floor 10)
    - Hidden gates to completely different types of dungeons, assorted in
      increasing complexity
        - Small boss lairs, all mobs spawned simultaneously
            - Belly of the slime (harder slime boss fight), floor 5
            - Arena of Trollol, floor 10
        - Glitches (after beating floor 19, any floor)
            - Uniquely animated sequences
            - Feature void enemies
            - Disproportionately high treasure amounts
            - Occasionally drops end shards
        - Mines (cave-like generation connected with sparse labyrinth-like
          shafts), any floor
        - Strongholds (defensively oriented rooms), floor 18
        - Catacombs (many rectangular rooms connected with labyrinths), floor 15
    - Appears uncommonly in certain floors
    - Unique mobs, music, and drops
- Final destination
    - An NPC appears after beating floor 19, saying "The end..."
    - Giving him end shards evolves its speech into "The end is inevitable and
      must be reached by giving shards to the dragon..."
    - Giving more shards to it increases the number of dots until 12, at which
      point this gets added: "Nothing more lol, what did you expect"
    - Giving a shard to the dragon causes it to try some experiment; music
      fades. Then, the omnious sound plays for the first time; the dragon is
      alarmed, gives the player its result (a countdown artifact), and says no
      more about this. The player is kicked out, the tunnel seals, and the NPC
      vanishes
    - Every time the timer reaches zero, the omnious sound plays, a floor goes
      missing, and the NPC reappears to say a single number before disappearing
    - The floor, however, can be entered through the previous floor's portal; it
      functions normally, though the time the screen glitches often
    - Every loss makes the music slower and lower (by a factor of log_{12} 2)
    - Around halfway through, the guild hall closes, and the ??? floor somehow
      becomes the new guild hall. The tunnel reopens, the dragon fight becomes
      disabled, and the dragon instructs the player to defend the other floors.
      At this point, all other floors actually go missing (can't be accessed
      from the previous floors), the NPC stops showing up, and remaining floors,
      if glitched while the player is present, sees large hordes of almost
      impossible end monsters that almost certainly vanquish the player
    - Once all the floors are gone, the last portal vapourizes and the dragon
      blesses the player. The player must now wait for the siege in the big room
    - At last, the siege of the end begins. The dragon, draconians, and player
      together must fight off a wave of end monsters; if the player fails, they
      can restart from the beginning of the siege, or clear cookies
    - Once it's done, the floors get unlocked in the same order they were locked
    - Once the player fights through half of it, they reach the guild hall; this
      is a tight battle, making it harder
    - Once the last floor is done, the player learns that the dragon has been
      corrupted, and must return to floor ??? to fight the ender dragon
    - After that's done, the end sequence plays and the game is complete, though
      glitches still occur as before (the NPC appears in random places and says
      "This is not the end... Just you wait..." before disappearing, though the
      countdown timer is destroyed)
    - The dragon fight can still be done after this, though the dragon feels as
      though an experiment with end shards is not a good idea