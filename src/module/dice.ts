import { Evaluated } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/dice/roll';
import { HVActor } from './actor/actor';

const templatePath = 'systems/helveczia/templates/chat/';

export type HVRollData = {
  parts?: (number | string)[];
  data?: any;
  title?: string;
  flavour?: string;
  flags?: any;
  speaker?: any;
  form?: any;
  chatMessage?: boolean;
  skipDialog?: boolean;
};

export class HVDice {
  static digestResult(data, roll) {
    const result: any = {
      isSuccess: false,
      isFailure: false,
      target: data.roll.target,
      total: roll.total,
    };

    if (data.roll.type == 'result') {
      if (roll.total == result.target) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == 'check') {
      if (roll.total >= result.target) {
        result.isSuccess = true;
      } else {
        result.isFailure = true;
      }
    } else if (data.roll.type == 'table') {
      // Reaction
      const table = data.roll.table;
      let output = Object.values(table)[0];
      for (let i = 0; i <= roll.total; i++) {
        if (table[i]) {
          output = table[i];
        }
      }
      result.details = output;
    }
    return result;
  }

  static async digestAttackResult(data, roll: Evaluated<Roll>) {
    let opponent: HVActor | undefined;
    let against = '';
    let withWeapon = '';
    let critical = {
      range: '20',
      multiple: 2,
    };
    if (data.item) {
      critical = data.item.system.critical;
      withWeapon = game.i18n.format('HV.withThere', { item: data.item.name });
      if (data.item.system.reload > 0) {
        const attacker = data.item.actor as HVActor;
        await attacker.setFlag('helveczia', 'reload-trigger', data.item.system.reload);
        console.log('fired and set reload-trigger to ', attacker.getFlag('helveczia', 'reload-trigger'));
      }
    }

    const result: any = {
      isSuccess: false,
      isFailure: false,
      isCrit: false,
      target: 10,
      formula: roll.formula,
      multiplier: critical.multiple,
      total: roll.total,
    };

    if (data.opponent?.id) {
      opponent = game.actors?.get(data.opponent.id);
      if (opponent) {
        result.target = opponent.system.ac;
        against += game.i18n.format('HV.against', { opponent: opponent.name });
      }
    }

    const rolledDie = roll.terms[0] as Die;
    const rolledResult = rolledDie.results[0]?.result;
    if (rolledResult >= parseInt(critical.range)) {
      result.isSuccess = true;
      result.isCrit = true;
      result.details = game.i18n.format('HV.messages.CriticalSuccess', { vs: against, wp: withWeapon });
    } else if (rolledResult === 1) {
      result.isFailure = true;
      result.isCrit = true;
      result.details = game.i18n.format('HV.messages.CriticalFailure', { vs: against, wp: withWeapon });
    } else if (roll.total < result.target) {
      result.details = game.i18n.format('HV.messages.AttackFailure', { vs: against, wp: withWeapon });
      result.isFailure = true;
    } else {
      result.details = game.i18n.format('HV.messages.AttackSuccess', { vs: against, wp: withWeapon });
      result.isSuccess = true;
    }
    return result;
  }

  static async sendRoll({
    parts = [],
    data,
    flags,
    title,
    flavour,
    speaker,
    form,
  }: HVRollData): Promise<Evaluated<Roll<any>>> {
    const template = data.roll.dmg?.length ? `${templatePath}/roll-attack.hbs` : `${templatePath}/roll-ability.hbs`;
    const chatData: any = {
      user: game.user?.id,
      speaker: speaker,
      flags: flags,
    };

    const templateData: any = {
      title: title,
      flavour: flavour,
      data: data,
      config: CONFIG.HV,
    };

    // Optionally include a situational bonus and DC
    if (form) {
      if (form.bonus.value) parts.push(form.bonus.value);
      data.roll.target = form.difficulty.value;
    }

    const roll = await new Roll(parts.join('+'), data).evaluate({ async: true });

    let dmgRoll: Evaluated<Roll<any>>;
    if (data.roll.dmg?.length) {
      dmgRoll = await new Roll(data.roll.dmg.join('+'), data).evaluate({ async: true });
    }

    // Convert the roll to a chat message and return the roll
    let rollMode = game.settings.get('core', 'rollMode');
    rollMode = form ? form.rollMode.value : rollMode;

    // Force blind roll (ability formulas)
    if (data.roll.blindroll) {
      rollMode = game.user?.isGM ? 'selfroll' : 'blindroll';
    }

    if (['gmroll', 'blindroll'].includes(rollMode)) chatData['whisper'] = ChatMessage.getWhisperRecipients('GM');
    if (rollMode === 'selfroll') chatData['whisper'] = [game.user?.id];
    if (rollMode === 'blindroll') {
      chatData['blind'] = true;
      data.roll.blindroll = true;
    }

    templateData.result = data.roll.dmg?.length
      ? await HVDice.digestAttackResult(data, roll)
      : HVDice.digestResult(data, roll);

    return new Promise(async (resolve) => {
      templateData.rollHV = await roll.render();
      templateData.dmgResult = dmgRoll?.total;
      templateData.rollDamage = dmgRoll ? await dmgRoll.render() : undefined;
      renderTemplate(template, templateData).then((content) => {
        chatData.content = content;
        // 2 Step Dice So Nice
        if (game['dice3d']) {
          game['dice3d'].showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(() => {
            if (templateData.result.isSuccess && dmgRoll) {
              templateData.result.dmg = dmgRoll.total;
              game['dice3d'].showForRoll(dmgRoll, game.user, true, chatData.whisper, chatData.blind).then(() => {
                ChatMessage.create(chatData);
                resolve(roll);
              });
            } else {
              ChatMessage.create(chatData);
              resolve(roll);
            }
          });
        } else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
          resolve(roll);
        }
      });
    });
  }

  static async Roll({
    parts = [],
    data,
    skipDialog = false,
    flags = {},
    chatMessage = true,
    title,
    flavour,
    speaker,
  }: HVRollData): Promise<Evaluated<Roll<any>>> {
    let rolled = false;
    const template = `${templatePath}/roll-dialog.hbs`;
    const dialogData = {
      formula: parts.join(' '),
      data: data,
      rollMode: data.roll.blindroll ? 'blindroll' : game.settings.get('core', 'rollMode'),
      rollModes: CONFIG.Dice.rollModes,
      diffs: CONFIG.HV.difficulties,
    };
    const rollData: HVRollData = {
      parts: parts,
      data: data,
      title: title,
      flavour: flavour,
      speaker: speaker,
      chatMessage: chatMessage,
      flags: flags,
    };
    if (skipDialog) {
      return HVDice.sendRoll(rollData);
    }

    const buttons = {
      ok: {
        label: game.i18n.localize('HV.Roll'),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          rolled = true;
          rollData.form = html[0].querySelector('form');
          roll = HVDice.sendRoll(rollData);
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('HV.Cancel'),
        callback: () => {
          /*noop */
        },
      },
    };

    const html = await renderTemplate(template, dialogData);
    let roll: Promise<Evaluated<Roll<any>>>;

    return new Promise((resolve) => {
      new Dialog({
        title: title ?? '',
        content: html,
        buttons: buttons,
        default: 'ok',
        close: () => {
          if (rolled) {
            resolve(roll);
          } else {
            PromiseRejectionEvent;
          }
        },
      }).render(true);
    });
  }
}
