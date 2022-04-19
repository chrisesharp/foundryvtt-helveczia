import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { HVActorData } from './actor-types';

export class HVActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData(): void {
    const actorData = this.data;
    const data = actorData.data;
    // const flags = actorData.flags;
    data.ac = 10;
  }

  prepareDerivedData(): void {
    const actorData = this.data;
    // const data = actorData.data;
    // const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    switch (actorData.type) {
      case 'character':
        this._prepareCharacterData(actorData);
        break;
      case 'npc':
        this._prepareNPCData(actorData);
        break;
    }
  }

  _categoriseItems(items) {
    return items.reduce(
      (acc, item) => {
        const category = acc[item.type] || [];
        category.push(item);
        acc[item.type] = category;
        return acc;
      },
      { possession: [], people: [], class: [], skill: [], armour: [], weapon: [], deed: [] },
    );
  }

  /**
   * Prepare Character type specific data
   */
  async _prepareCharacterData(actorData: ActorData) {
    const data = actorData.data;
    const categories = this._categoriseItems(actorData.items);
    data.possessions = {
      articles: categories['possession'],
      weapons: categories['weapon'],
      armour: categories['armour'],
    };
    data.skills = categories['skill'];
    data.peoples = categories['people'];
    data.classes = categories['class'];
    data.deeds = categories['deed'];
    data.level = this._calculateLevel(data.experience);

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._updateAC(data);
    // await actorData.update({ data: data });
    // await actorData.token.update({ disposition: 1, actorLink: true });
  }

  /**
   * Prepare NPC type specific data
   */
  async _prepareNPCData(actorData: ActorData) {
    await actorData.token.update({ disposition: -1 });
  }

  /**
   * Calculate current level from experience
   */
  _calculateLevel(experience: number) {
    let level = 1;
    if (experience >= 5000) {
      level = 2;
    }
    return level;
  }

  /**
   * Prepare AC based on mods
   * @param data
   */

  _updateAC(data: any): void {
    data.ac += data.scores.dex.mod;
  }

  /**
   * Update current bonus for ability
   */
  _updateAbility(ability: { value: number; mod: number }) {
    ability.value = Math.min(Math.max(ability.value, 0), 18);
    ability.mod = Math.round(ability.value / 3) - 3;
  }

  // Armour is not cumulative in effect, so disable the weaker ones
  // Effectiveness is measured as larger negative number
  /** @override */
  applyActiveEffects() {
    // const armourEffects = {};
    // let mostEffective = 0;
    // let mostEffectiveId = "not set";
    // this.effects.forEach ((e) => {
    //   let armourChanges = e.data.changes.filter(x=>(x.key === "data.ac"));
    //   if (armourChanges.length) {
    //     if (e.id) {
    //       armourEffects[e.id] = e;
    //       let value = parseInt(e.data.changes[0].value)
    //       if (value < mostEffective) {
    //         mostEffective = value;
    //         mostEffectiveId = e.id;
    //       }
    //     }
    //   }
    // });

    // Object.keys(armourEffects).forEach((id) => {
    //   armourEffects[id].data.disabled = (mostEffectiveId != id);
    // });
    super.applyActiveEffects();
  }
}

declare global {
  interface DocumentClassConfig {
    Actor: typeof HVActor;
  }

  interface DataConfig {
    Actor: HVActorData;
  }
}
