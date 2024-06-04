import { Cleric } from './items/class/cleric';
import { Student } from './items/class/student';

export const registerHandlebarHelpers = async function () {
  Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
  });

  Handlebars.registerHelper('lt', function (a, b) {
    return a < b;
  });

  Handlebars.registerHelper('abs', function (a) {
    return Math.abs(a);
  });

  Handlebars.registerHelper('ordinal', function (a) {
    const level: number = parseInt(a);
    const suffix = getOrdinal(level);
    return `${level}${suffix}`;
  });

  Handlebars.registerHelper('bonusSkills', function (num, skill, role, lvl) {
    const level = `${lvl}${getOrdinal(parseInt(lvl))}`;
    return game.i18n.format('HV.bonusSkills', { num: num, skill: skill, role: role, level: level });
  });

  Handlebars.registerHelper('cardsFilter', function (playTarget, cards) {
    return cards.filter((c) => c.name.includes(playTarget));
  });

  Handlebars.registerHelper('largest', function (lh, rh) {
    return Math.max(parseInt(lh), parseInt(rh));
  });

  Handlebars.registerHelper('smallest', function (lh, rh) {
    return Math.min(parseInt(lh), parseInt(rh));
  });

  Handlebars.registerHelper('subtract', function (lh, rh) {
    return parseInt(lh) - parseInt(rh);
  });

  Handlebars.registerHelper('divide', function (lh, rh) {
    return Math.floor(parseFloat(lh) / parseFloat(rh));
  });

  Handlebars.registerHelper('mult', function (lh, rh) {
    return Math.round(100 * parseFloat(lh) * parseFloat(rh)) / 100;
  });

  Handlebars.registerHelper('times', function (n, block) {
    let accum = '';
    for (let i = 0; i < n; ++i) accum += block.fn(i);
    return accum;
  });

  Handlebars.registerHelper('reds', function (n) {
    return Math.min(7, n);
  });

  Handlebars.registerHelper('blues', function (n) {
    return Math.max(0, Math.min(7, n - 7));
  });

  Handlebars.registerHelper('greens', function (n) {
    return Math.max(0, Math.min(7, n - 14));
  });

  Handlebars.registerHelper('hasArmour', function (a) {
    return 0 < a && a < 6;
  });

  Handlebars.registerHelper('isWorn', function (item) {
    return item.getFlag('helveczia', 'position') === 'worn';
  });

  Handlebars.registerHelper('itemLocked', function (item) {
    return item.getFlag('helveczia', 'locked');
  });

  Handlebars.registerHelper('bonusSpell', function (item) {
    return item.getFlag('helveczia', 'bonusSpell') as boolean;
  });

  Handlebars.registerHelper('castSpell', function (item) {
    return item.getFlag('helveczia', 'castSpell') as boolean;
  });

  Handlebars.registerHelper('deedLocalize', function (text) {
    return game.i18n.localize(`HV.deeds.${text}`);
  });

  Handlebars.registerHelper('isStudentSpecialSkill', function (name) {
    return Student.specialisms().includes(name);
  });

  Handlebars.registerHelper('isClericSpecialSkill', function (name) {
    return Cleric.specialisms().includes(name);
  });

  Handlebars.registerHelper('concat', function (args) {
    let outStr = '';
    for (const arg in args) {
      if (typeof args[arg] != 'object') {
        outStr += args[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('die', function (die) {
    die = Math.min(20, Math.max(4, die));
    return CONFIG.HV.icons[`d${die}`];
  });

  Handlebars.registerHelper('isChecked', function (isChecked) {
    return isChecked ? ' checked ' : '';
  });

  Handlebars.registerHelper('isSelected', function (isSelected, value) {
    return isSelected === value ? ' selected ' : '';
  });

  Handlebars.registerHelper('plusminus', function (value) {
    return value > 0 ? `+${value}` : value;
  });

  Handlebars.registerHelper('insertLink', function (item) {
    return TextEditor.enrichHTML(item.id, { async: false });
  });

  Handlebars.registerHelper('typeOfSkill', function (value) {
    return game.i18n.format('HV.skillType', { type: value });
  });

  Handlebars.registerHelper('usingAbility', function (value) {
    return game.i18n.format('HV.usingAbility', { ability: game.i18n.localize(`HV.scores.${value}.long`) });
  });

  Handlebars.registerHelper('balance', function (virtue) {
    const total = Math.sign(Math.floor((virtue - 1) / 7) - 1);
    switch (total) {
      case -1:
        return 'fas fa-balance-scale-left';
      case 1:
        return 'fas fa-balance-scale-right';
      default:
        return 'fas fa-balance-scale';
    }
  });

  Handlebars.registerHelper('balanceTip', function (virtue) {
    const total = Math.sign(Math.floor((virtue - 1) / 7) - 1);
    let state = '';
    switch (total) {
      case -1:
        state = 'Low';
        break;
      case 0:
        state = 'Average';
        break;
      case 1:
        state = 'High';
        break;
    }
    return `${state} Virtue`;
  });

  Handlebars.registerHelper('contains', function (e, arr) {
    return arr.includes(e);
  });

  Handlebars.registerHelper('length', function (arr) {
    return arr.length;
  });

  Handlebars.registerHelper('success', function (roll) {
    let success = 'normal';
    if (roll >= 18 && roll < 24) success = 'hard';
    else if (roll >= 24) success = 'heroic';
    return game.i18n.localize(`HV.success.${success}`);
  });

  Handlebars.registerHelper('hasSpells', function (spellsArr) {
    return spellsArr[0].length > 0 || spellsArr[1].length > 0 || spellsArr[2].length > 0;
  });

  Handlebars.registerHelper('player', function (id) {
    const player = game.users?.players.find((p) => p.character?.id === id);
    return player ? player.name : '';
  });
};

function getOrdinal(level: number): string {
  let suffix: string;
  switch (level) {
    case 1:
      suffix = 'st';
      break;
    case 2:
      suffix = 'nd';
      break;
    case 3:
      suffix = 'rd';
      break;
    default:
      suffix = 'th';
  }
  return suffix;
}
