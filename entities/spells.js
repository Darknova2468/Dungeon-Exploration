/**
 * Here are spells in their full glory!
 * 
 * Common spell variables include:
 * - spellLevel: Level of spell, determined by player and capped by knowledge
 * - spellAffinity: Appropriate focus used for a particular spell. Multiplies 
 *   spellPower by the tier of the focus used (or 2 for now); see spellPower
 * - spellPower: Power level of spell, calculated with spellAffinity and the 
 *   player's knowledge. Converted to spellBonus as 1 + spellPower/10
 * - spellTier: Mana tier of spell, determined by its type. That is, weaker 
 *   spells such as mend are lower tiered than the strong ones like solar storm
 * - spellBonus: Percentage increase in potency of spell; see spellPower
 * - spellFunction: actual function for casting the spell.
 */

const ALLSPELLS = {
  emptySpell(player, spellLevel, spellBonus, enemies, direction, time, isRolling) {

  },
  mend(player, spellLevel, spellBonus, enemies, direction, time, isRolling) {
    player.health += Math.floor((1 + spellBonus) * spellLevel * Math.log(1 + spellLevel*2));
    player.health = Math.min(player.health, player.maxHealth);
  },
};

/**
 * Each entry contains:
 * 
 * - Mana spell tier
 * - Spell affinity
 * - Execution function
 */
const SPELLDATA = new Map([
  [1, [2, "Wand", ALLSPELLS.emptySpell]],
  [5, [2, "Amulet", ALLSPELLS.mend]],
]);

class SpellManager {
  constructor(player) {
    this.player = player;
    this.knownSpells = new Map();

    // Temporary things
    this.knownSpells.set(5, 2);
  }

  computeMana(spellTier, spellLevel) {
    console.log("Spell tier is " + spellTier);
    return Math.floor(spellLevel * Math.log(2 + spellTier * spellTier * spellLevel));
  }

  prepareSpell(spell, spellLevel) {  
    if(!this.knownSpells.has(spell)) {
      return [false, "Unknown or invalid spell!"];
    }

    let [spellTier, spellAffinity, spellFunction] = SPELLDATA.get(spell);
    let spellPower = this.knownSpells.get(spell);
    if(this.player.holding !== null) {
      spellPower *= 1 + (this.player.holding.name === spellAffinity);
    }
    if(spellLevel > spellPower) {
      return [false, "Spell level too high!"];
    }
    let requestedMana = this.computeMana(spellTier, spellLevel);
    if(requestedMana > this.player.mana) {
      return [false, "Not enough mana!"]
    }
    return [true, requestedMana, spellPower, spellFunction]
  }

  castSpell(enemies, direction, time, isRolling) {
    if(!castOverlay.charging) {
      return false;
    }
    let spell = castOverlay.spellSelect;
    let spellLevel = castOverlay.castLevel;
    let spellInfo = this.prepareSpell(spell, spellLevel);
    if(!spellInfo[0]) {
      return false;
    }
    spellInfo[3](this.player, spellLevel, (1 + spellInfo[2] / 10),
      enemies, direction, time, isRolling);
    this.player.mana -= spellInfo[1];
    castOverlay.release();
    return true;
  }
}