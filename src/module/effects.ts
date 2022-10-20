import Document, {
  Metadata,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ActiveEffectDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/activeEffectData';
import { EffectChangeData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData';
import { EffectDurationDataSource } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectDurationData';

export function createConsequenceEffect(resource: string, value: number, owner: Document<any, any, Metadata<any>>) {
  const change: Partial<EffectChangeData> = {
    key: `data.resource.${resource}.value`,
    mode: 2,
    value: `${value}`,
  };
  const duration: EffectDurationDataSource = {
    combat: undefined,
    rounds: undefined,
    seconds: undefined,
    startRound: 1,
    startTime: 0,
    startTurn: 0,
    turns: undefined,
  };
  const effectData: ActiveEffectDataConstructorData = {
    icon: 'icons/svg/aura.svg',
    origin: owner.uuid,
    duration: duration,
    flags: {},
    disabled: false,
    transfer: true,
    changes: [change],
  };
  return ActiveEffect.create(effectData, { parent: owner });
}

/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId ? owner.effects?.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case 'create':
      return ActiveEffect.create(
        {
          label: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
        },
        { parent: owner },
      );
    case 'edit':
      return effect.sheet.render(true);
    case 'delete':
      return effect.delete();
    case 'toggle':
      return effect.update({ disabled: !effect.disabled });
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  type Effects = {
    type: string;
    label: string;
    effects: ActiveEffect[];
  };

  type Categories = {
    temporary: Effects;
    passive: Effects;
    inactive: Effects;
  };
  // Define effect header categories
  const temporary: Effects = {
    type: 'temporary',
    label: 'Temporary',
    effects: [],
  };
  const passive: Effects = {
    type: 'passive',
    label: 'Passive',
    effects: [],
  };
  const inactive: Effects = {
    type: 'inactive',
    label: 'Inactive',
    effects: [],
  };

  const categories: Categories = {
    temporary: temporary,
    passive: passive,
    inactive: inactive,
  };

  // Iterate over active effects, classifying them into categories
  for (const e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}
