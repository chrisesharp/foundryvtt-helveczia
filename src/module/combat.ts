const colours = ['', 'orange', 'red', 'red', 'red'];

export class HVCombat {
  static format(object, html, data) {
    // console.log("cobat:",data)
    if (data.combat) {
      const current = data.combat?.current ?? 0;
      html.find('.combatant').each(async (_, ct) => {
        const id = ct.dataset.combatantId;
        const cmbtant = object.viewed.combatants.get(id) as Combatant;
        const actor = cmbtant.actor;
        const currentTurn = parseFloat(`${current.round}.${current.turn}`);
        if (actor !== null) {
          const reloadTrigger = actor.getFlag('helveczia', 'reload-trigger') as number;
          // console.log("in combat - reloadTrigger = ", reloadTrigger)
          if (reloadTrigger > 0) {
            await actor.setFlag('helveczia', 'reload-trigger', 0);
            await actor.setFlag('helveczia', 'reloaded', currentTurn + parseFloat(`${reloadTrigger}`));
            // console.log("set reload-trigger to 0 and reloaded to ", actor.getFlag('helveczia','reloaded'))
          }

          const reload = (actor.getFlag('helveczia', 'reloaded') as number) - currentTurn;
          // console.log("reload = ", reload)
          // Append colored flag
          if (!isNaN(reload) && reload > 0) {
            const colour = colours[Math.round(reload)];
            const controls = $(ct).find('.combatant-controls');
            controls.append(
              `<a class='combatant-control flag' style='color:${colour}' title="${colour}"><i class='fas fa-flag'></i></a>`,
            );
          }
        }
      });
      HVCombat.addListeners(html, data);
    }
  }

  static addListeners(html, data) {
    // Cycle through colors
    html.find('.combatant-control.flag').click((ev) => {
      if (!data.user.isGM) {
        return;
      }
      const currentColour = ev.currentTarget.style.colour;

      let index = colours.indexOf(currentColour);
      index = Math.max(0, index - 1);
      const id = $(ev.currentTarget).closest('.combatant')[0].dataset.combatantId;
      const combatant = game.combat?.data.combatants.get(id);
      if (combatant)
        combatant.update({
          id: id,
          flags: { helveczia: { reloaded: index } },
        });
    });
  }
}
