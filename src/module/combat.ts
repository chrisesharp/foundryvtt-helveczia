import { Logger } from './logger';

const log = new Logger();
const colours = ['', 'orange', 'red'];

export class HVCombat {
  static format(combatTracker, html, data) {
    if (data.combat) {
      const numCombatants = data.combat.combatants.size;
      const turnFraction = 1 / numCombatants;

      const current = data.combat?.current ?? 0;
      html.find('.combatant').each(async (_, ct) => {
        const id = ct.dataset.combatantId;
        const cmbtant = combatTracker.viewed.combatants.get(id) as Combatant;
        const actor = cmbtant.actor;
        const initBonus = cmbtant.getFlag('helveczia', 'init-bonus') ?? 0;
        const controls = $(ct).find('.combatant-controls');
        const initiativeCtrl = $(ct).find('.token-initiative');
        const currentTurn = current.round + current.turn * turnFraction;
        log.debug(`HVCombat.format() | currentTurn = ${currentTurn}`);
        if (actor !== null && game.user?.isGM) {
          initiativeCtrl.prepend(
            `<div class='init-bonus-ctrl'>
              <a class='combatant-control init-up'><i class='fas fa-caret-up' title="increase bonus"></i></a>
              <a class='combatant-control init' style="color:white" title="additional initiative bonus">${initBonus}</a>
              <a class='combatant-control init-down'><i class='fas fa-caret-down' title="decrease bonus"></i></a>
            </div>`,
          );
          const reloadTrigger = actor.getFlag('helveczia', 'reload-trigger') as number;
          if (reloadTrigger > 0) {
            log.debug(`HVCombat.format() | id:${id} reloadTrigger = ${reloadTrigger}`);
            await actor.unsetFlag('helveczia', 'reload-trigger');
            await cmbtant.setFlag('helveczia', 'reloaded', currentTurn + parseFloat(`${reloadTrigger}`));
            log.debug(
              `HVCombat.format() |id:${id} unset reload-trigger and set reloaded to ${cmbtant.getFlag(
                'helveczia',
                'reloaded',
              )}`,
            );
          }
        }
        let reload = cmbtant.getFlag('helveczia', 'reloaded') as number;

        if (!isNaN(reload)) {
          reload = Math.max(0, reload - currentTurn);
          log.debug(`HVCombat.format() |id:${id} reload = ${reload}`);
          // Append colored flag
          if (Math.round(reload) > 0) {
            const index = Math.min(2, Math.round(reload));
            const colour = colours[index];
            // const controls = $(ct).find('.combatant-controls');
            controls.prepend(
              `<a class='combatant-control flag' style='color:${colour}' title="${reload.toFixed(
                1,
              )} turns to reload."><i class='fas fa-redo'></i></a>`,
            );
          } else {
            if (game.user?.isGM) {
              await cmbtant.unsetFlag('helveczia', 'reloaded');
              log.debug(`HVCombat.format() |id:${id} unset reloaded`);
            }
          }
        }
      });
    }

    HVCombat.addListeners(combatTracker, html, data);
  }

  static addListeners(combatTracker, html, data) {
    // Cycle through colors
    html.find('.combatant-control.flag').click(async (ev) => {
      if (!data.user.isGM) {
        return;
      }
      const id = $(ev.currentTarget).closest('.combatant')[0].dataset.combatantId;
      const combatant = game.combat?.data.combatants.get(id);
      if (combatant) {
        let reload = combatant?.getFlag('helveczia', 'reloaded') as number;
        reload = Math.max(0, reload - 0.5);
        if (reload > 0) {
          await combatant.setFlag('helveczia', 'reloaded', reload);
        } else {
          await combatant.unsetFlag('helveczia', 'reloaded');
        }
      }
      Hooks.call('renderCombatTracker', combatTracker, html, data);
    });

    html.find('.combatant-control.init-up').click(async (ev) => {
      if (!data.user.isGM) {
        return;
      }
      const id = $(ev.currentTarget).closest('.combatant')[0].dataset.combatantId;
      const combatant = game.combat?.data.combatants.get(id);
      if (combatant) {
        const initBonus = ((combatant?.getFlag('helveczia', 'init-bonus') as number) ?? 0) + 1;
        await combatant.setFlag('helveczia', 'init-bonus', initBonus);
      }
      Hooks.call('renderCombatTracker', combatTracker, html, data);
    });

    html.find('.combatant-control.init-down').click(async (ev) => {
      if (!data.user.isGM) {
        return;
      }
      const id = $(ev.currentTarget).closest('.combatant')[0].dataset.combatantId;
      const combatant = game.combat?.data.combatants.get(id);
      if (combatant) {
        const initBonus = ((combatant?.getFlag('helveczia', 'init-bonus') as number) ?? 0) - 1;
        await combatant.setFlag('helveczia', 'init-bonus', initBonus);
      }
      Hooks.call('renderCombatTracker', combatTracker, html, data);
    });
  }
}

export class HVCombatant extends Combatant {
  protected _getInitiativeFormula(): string {
    let formula = super._getInitiativeFormula();
    const initBonus = this.getFlag('helveczia', 'init-bonus') as number;
    if (initBonus > 0) {
      formula += `+${initBonus}`;
    }
    return formula;
  }
}
