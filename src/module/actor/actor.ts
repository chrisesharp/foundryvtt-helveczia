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
  async _prepareCharacterData(actorData) {
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
    await actorData.update({ data: data });
    await actorData.token.update({ disposition: 1, actorLink: true });
  }

  /**
   * Prepare NPC type specific data
   */
  async _prepareNPCData(actorData) {
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
}
