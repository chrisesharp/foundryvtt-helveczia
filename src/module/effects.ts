import { HVActor } from './actor/actor';

export function getActorEffect(owner: HVActor, effectId: string) {
  let effect: ActiveEffectData | null = null;
  for (const e of owner.allApplicableEffects()) {
    if (e.id === effectId) {
      effect = e;
      break;
    }
  }
  return effect;
}
/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
export function onManageActiveEffect(event, target, owner) {
  event.preventDefault();
  const a = target;
  const li = a.closest('li');
  // let effect: ActiveEffectData | null = null;
  // if (owner instanceof HVActor) {
  //   effect = getActorEffect(owner, li.dataset.effectId);
  // } else {
  //   effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId)[0] : null;
  // }
  const effect = this._getEmbeddedDocument(target);
  switch (a.dataset.action) {
    case 'create':
      return ActiveEffect.create(
        {
          name: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
        },
        { parent: owner },
      );
    case 'edit':
      return effect?.sheet.render(true);
    case 'delete':
      return effect?.delete();
    case 'toggle':
      return effect?.update({ disabled: !effect.disabled });
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
    e.sourceName; // Trigger a lookup for the source name
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}
