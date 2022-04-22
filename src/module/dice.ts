import { Evaluated } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll';

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

  static digestAttackResult(data, roll) {
    const result: any = {
      isSuccess: false,
      isFailure: false,
      target: '???',
      total: roll.total,
    };
    result.target = data.roll.thac0;

    const targetAC = data.roll.target ? data.roll.target.actor.data.data.ac : 0;

    result.victim = data.roll.target ? data.roll.target.data.name : null;

    if (roll.terms[0] == 20) {
      // TODO instant kill
    } else if (roll.terms[0] == 1) {
      // TODO critical failure
    } else if (roll.total < targetAC) {
      result.details = game.i18n.format('HV.messages.AttackFailure');
    } else {
      result.details = game.i18n.format('HV.messages.AttackSuccess');
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
    const template = data.roll.dmg ? `${templatePath}/roll-attack.hbs` : `${templatePath}/roll-ability.hbs`;
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
    if (data.roll.dmg) {
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

    templateData.result = data.roll.dmg ? HVDice.digestAttackResult(data, roll) : HVDice.digestResult(data, roll);

    return new Promise(async (resolve) => {
      templateData.rollHV = await roll.render();
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
  }: HVRollData) {
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

    //Create Dialog window
    return new Promise((resolve) => {
      new Dialog({
        title: title ?? '',
        content: html,
        buttons: buttons,
        default: 'ok',
        close: () => {
          resolve(rolled ? roll : false);
        },
      }).render(true);
    });
  }
}
