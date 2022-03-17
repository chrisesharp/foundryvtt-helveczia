import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { HVActorData } from './actor-types';

export class HVActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  /** @override */
  prepareData() {
    super.prepareData();

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
      { possession: [], people: [], class: [], skill: [], armour: [], weapon: [] },
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
    data.level = this._calculateLevel(data.experience);

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    await actorData.update({ data: data });
    await actorData.token.update({ disposition: 1, actorLink: true });
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
   * Update current bonus for ability
   */
  _updateAbility(ability: { value: number; mod: number }) {
    ability.value = Math.min(Math.max(ability.value, 0), 18);
    ability.mod = Math.round(ability.value / 3) - 3;
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
