/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @return {Array}              The extended options Array including new context choices
 */
/* -------------------------------------------- */

const templatePath = 'systems/helveczia/templates/chat/';

export class HVChat {
  static addChatCriticalButton(_msg, html, _data): void {
    // Buttons
    const cb = html.find('.critical-roll');
    switch (cb.data('id')) {
      case 'critical':
        HVChat._addCritButton(cb);
        break;
      default:
        break;
    }
  }

  static _addCritButton(cb): void {
    const dmgResult = cb.data('dmgResult');
    const target = cb.data('target');
    const multiplier = cb.data('multiplier');
    const formula = cb.data('formula');
    cb.find('#hidden-damage').hide();
    const button = `<div class="critical-button"><button class="critical" type="button" data-action="critroll" data-formula="${formula}" data-dmg-result="${dmgResult}" data-multiplier="${multiplier}" data-target="${target}"><i class="fas fa-dice-d20"></i>${game.i18n.localize(
      'HV.RollAgain',
    )}</button></div>`;
    cb.append($(button));
    cb.find('button[data-action="critroll"]').click(async (ev) => {
      ev.preventDefault();
      const target = ev.currentTarget.dataset.target;
      const formula = ev.currentTarget.dataset.formula;
      const dmgResult = ev.currentTarget.dataset.dmgResult;
      const multiplier = ev.currentTarget.dataset.multiplier;
      $(ev.currentTarget).remove();
      HVChat._applyChatCritRoll({
        cb: cb,
        target: target,
        formula: formula,
        dmgResult: dmgResult,
        multiplier: multiplier,
      });
    });
  }

  static async _applyChatCritRoll({ cb, target, formula, dmgResult, multiplier }): Promise<void> {
    const roll = await new Roll(formula).evaluate({ async: true });
    const rolledDie = roll.terms[0] as Die;
    const rolledResult = rolledDie.results[0]?.result;
    let result: string;
    if (rolledResult === 20) {
      result = `<h1>${game.i18n.format('HV.InstantDeath')}<h1>`;
    } else if (roll.total >= target) {
      const total = dmgResult * multiplier;
      result = `<h2>A second critical!<h2><h4 class="dice-total" id="dmg-result">${dmgResult} x ${multiplier} = ${total}</h4>`;
    } else {
      result = `<h4 class="dice-total" id="dmg-result">${dmgResult}</h4>`;
    }

    const templateData = {
      result: result,
      rollHV: await roll.render(),
    };
    const html = await renderTemplate(`${templatePath}/roll-crit.hbs`, templateData);
    cb.append($(html));
    const actualDmgResult = cb.find('#dmg-result').remove();
    const hiddenDmg = cb.find('#hidden-damage').remove();
    $(hiddenDmg).find('.dice-total').remove();
    $(hiddenDmg).find('.dice-result').append($(actualDmgResult));
    cb.append($(hiddenDmg));
    cb.find('#hidden-damage').show();
  }
}
