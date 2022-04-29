import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
// import { EffectChangeData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';

export class PeopleItem extends BaseItem {
  static get documentName() {
    return 'people';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static async onCreate(
    item: HVItem,
    data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    if (item.parent) return;
    switch (data.name) {
      case 'German':
        break;
      case 'French':
        await PeopleItem.addFrenchEffects(item);
        break;
      case 'Italian':
        break;
      case 'Dutch':
        break;
      case 'Czech':
        break;
      case 'English':
        break;
      case 'Gypsy':
        break;
      case 'Hungarian':
        break;
      case 'Jew':
        break;
      case 'Cossack':
        break;
      case 'Pole':
        break;
      case 'Spaniard':
        break;
      case 'Swede':
        break;
      default:
        break;
    }
  }

  static async addFrenchEffects(item: HVItem) {
    console.log('Adding French effects');
    const armourEffect = { key: 'data.ac', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '1' };
    const deftnessEffect = { key: 'data.saves.deftness.bonus', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '1' };
    const effect = await ActiveEffect.create(
      {
        label: 'Finesse',
        icon: 'icons/svg/aura.svg',
        origin: item.uuid,
        transfer: true,
        changes: [armourEffect, deftnessEffect],
      },
      { parent: item },
    );
    if (effect) {
      await item.updateEmbeddedDocuments('ActiveEffect', [{ _id: effect.id, effects: [effect] }]);
    } else {
      console.log('Effect was undefined!');
    }
    return item.update();
  }
}
