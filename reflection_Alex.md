# Alexander Ha - Project Reflection

## The Hardest Part

For me this project was definitly a test of cooporation and compromise. I have defenitly struggled to give up control over aspects of the project as I tend to be very stubborn when it comes to accepting new ideas. The most difficult aspect however was Dungeon Generation. For this Robert was definetly the heavy lifter as he learnt all the difficult algorithms such as prims, cellular automota, and convex hull. My role in the dungeon generation was the placment of the rooms and structure of the code.

In order to determine the placment of the rooms is quiet simple and paramaterized. The first thing you define is how many rooms you want, the size of the rooms, the chance it is a path or labyrinth, and the "two path chance". after this is generate it creates a new Room Object for each room in the dungeon. Then using these it gives each room a specific radius within a randomised range. Following this it then uses the two path chance and path or labyrinth chance to determine if the connection between rooms will be one of three cases. 
- empty 
- path
- labyrinth 

All of the aformentioned options have their own range of lengths associated with them as well. As room 0 connects to 1 and 2 and 1 connects to 2 and 3 and so on and so forth, it creates a network of triangles with known lengths. 

Then we use a propegation algorithm I developed similar to how CAD softwares solve geometry. The first step is initializing an angle which uses cosine law to find the angle at room 0. then subdivides that angle and takes the sin and cosine of that angle multiplies by the length of the leg plus the radius of the two rooms its connecting to solve for the x, and y coordinate of the room. the does the same with the negative half angle to solve for the position of room 2.

Once the initialization is complete is runs a loop using the positions of room(n-1) and room(n-2) to solve for the position of room(n). I came up with a very elogant soultion to this problem, where you have two known points and 3 lengths and u must solve for p3. you first find the angle alpha between p1 and p2 by doing (p2y-p1y)/(p2x-p2y), then using cosine law to solve for angle beta at room(n). To solve for angle theta which equals alpha - beta * -1^n. The -1^n is very important as it alternates the direction of the rooms so they never intersect. Then we simply take the sin and cos of angle theta, multiply by the length of the leg from room(n-2) too room(n) plus their radius, adding on the position of room(n-2) to solve for p3. In doing this we succesfully propogate the location of all of our rooms.

Lastly we use a min max function and the positions of the rooms to create a bounding box for an array that will hold the map data. Then the rasterization generation of labyrinths and everything beyond that although I came up with the theory, the implementation is all voodo magic too me and 100% Roberts domain. But for me this propigation algorithm was the most difficult task.

P.S. (I never wanna make textures again... It was terrible)

## Did we meet our "Need's To Have" List

NOPE!

We absolutley did not, we shot way to high and over estimated our own abilities and short commings

However we did sucesfully fully complete without compromise
- Proceduraly Generated Dungeons
- Multiple Enemy Types
- Dynamic Lighting and Exploration
- Weapons and Armour Upgrades
- Textures

With compromise we completed
- Bosses
- Materials and Mob Drop System
- Textures
- SFX and Music

What we completly ommited was
- Guild Hall
- Save Files

However we completed some of our "Nice To Have" list
- Charectoristic AI's for different enemy types

## What Problems Couldn't we Solve

- the forth and final boss
- mob drops and materials
- Textures
- sfx and music

## Past Reflections

This project taught me a lot of useful skills including
- GitHub
- Cooperation
- Communication
- OOP
- Texturing

Too my future self their are a couple things I would give as advice.
- Think small, and make your project expandable.
    - I felt past projects such as [Escape The Island] had a very low celining and I quickly ran out of things to develop.
    - Which led me to set the minimal viable product lower in hopes of not hitting said ceiling
    - this however was a very foolish desicion.

- Fun Factor First
    - In my eyes this game lacks a fun factor that really grabs the players attention
    - I feel before expanding you must make your game fun then you can add new
        - Enemies
        - Bosses
        - Content

- Add a Time Multiplier
    - If you think something will take a month it will take 2
        - A good friend of mine once said that to me.
        - Always think things will take longer than expected.
        - If you think you can get something done in 1 hour multiply it by 2 and its a bit more realistic
            -If we had done this to our initial timeline I feel we would have been on schedule and would not have had to make compromises

- Lastly, To-Do list
    - Throughout the project we were often unorganised and lost track of what were working on or what needed to be done
    - However when we created a Google docs with a to-do list by priority, everything ran more efficent and what needed to be done got done.