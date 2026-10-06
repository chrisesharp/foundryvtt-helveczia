import { HVActor } from './documents/actor';

export function getActorEffect(owner: HVActor, effectId: string) {
  let effect: ActiveEffect | null = null;
  for (const e of owner.allApplicableEffects()) {
    if (e.id === effectId) {
      effect = e;
      break;
    }
  }
  return effect;
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
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}
