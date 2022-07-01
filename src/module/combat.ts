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
        const currentTurn = current.round + current.turn * turnFraction;
        log.debug(`HVCombat.format() | currentTurn = ${currentTurn}`);
        if (actor !== null && game.user?.isGM) {
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
            const controls = $(ct).find('.combatant-controls');
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
  }
}
