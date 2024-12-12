/**
 * Each entry contains:
 * 
 * - Mana spell tier
 * - Spell affinity
 * - Execution function
 */

const ALLSPELLS = {
  emptySpell(player, spellLevel, spellBonus) {

  },
  mend(player, spellLevel, spellBonus) {
    player.health += Math.floor((1 + spellBonus) * spellLevel * Math.log(1 + spellLevel*2));
    player.health = Math.min(player.health, player.maxHealth);
  },
};

const SPELLDATA = new Map([
  [5, [2, "Amulet", ALLSPELLS.mend]],
  [9, [2, "Amulet", ALLSPELLS.emptySpell]],
]);

class SpellManager {
  constructor(player) {
    this.player = player;
    this.knownSpells = new Map();
  }

  computeMana(spellTier, spellLevel) {
    return Math.floor(spellLevel * Math.log(1 + spellTier * spellTier * spellLevel));
  }

  castSpell(spell, spellLevel) {  
    if(!this.knownSpells.has(spell)) {
      return [false, "Unknown or invalid spell!"];
    }

    let [spellTier, spellAffinity, spellFunction] = SPELLDATA.get(spell);
    let spellPower = this.knownSpells.get(spell);
    if(this.player.holding !== null) {
      spellPower *= 1 + (this.player.holding.name === spellAffinity);
    }
    if(spellLevel > this.spellPower) {
      return [false, "Spell level too high!"];
    }
    spellFunction(this.player, spellLevel, (1 + spellPower / 10));
  }
}