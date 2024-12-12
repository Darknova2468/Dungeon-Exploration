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
  mend(player, spellLevel, spellBonus, enemies, direction, time, isRolling) {
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

    // Temporary things
    this.knownSpells.set(5, 1);
  }

  computeMana(spellTier, spellLevel) {
    return Math.floor(spellLevel * Math.log(1 + spellTier * spellTier * spellLevel));
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
    let requestedMana = this.computeMana(spell, spellTier);
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